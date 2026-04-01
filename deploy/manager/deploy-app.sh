#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

DEPLOY_BRANCH=${DEPLOY_BRANCH:-main}
REMOTE_ENV_FILE=${REMOTE_ENV_FILE:-/opt/findit/shared/.env.stack}
STACK_NAME=${STACK_NAME:-findit}
BACKEND_SERVICE_NAME=${BACKEND_SERVICE_NAME:-${STACK_NAME}_backend}
SKIP_GIT_SYNC=${SKIP_GIT_SYNC:-0}
BACKEND_HEALTH_URL=${BACKEND_HEALTH_URL:-http://127.0.0.1:3000/api/health}
PUBLIC_BACKEND_HEALTH_URL=${PUBLIC_BACKEND_HEALTH_URL:-http://127.0.0.1/api/health}
PUBLIC_FRONTEND_URL=${PUBLIC_FRONTEND_URL:-http://127.0.0.1/}

if [ "$SKIP_GIT_SYNC" != "1" ]; then
  cd "$REPO_ROOT"
  git fetch origin
  git checkout "$DEPLOY_BRANCH"
  git pull --ff-only origin "$DEPLOY_BRANCH"
fi

if [ ! -f "$REMOTE_ENV_FILE" ]; then
  echo "Deployment env file not found: $REMOTE_ENV_FILE" >&2
  exit 1
fi

if [ -n "${BACKEND_IMAGE:-}" ]; then
  if grep -q '^BACKEND_IMAGE=' "$REMOTE_ENV_FILE"; then
    sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=$BACKEND_IMAGE|" "$REMOTE_ENV_FILE"
  else
    printf '\nBACKEND_IMAGE=%s\n' "$BACKEND_IMAGE" >> "$REMOTE_ENV_FILE"
  fi
fi

cd "$REPO_ROOT/findit_backend"
ENV_FILE="$REMOTE_ENV_FILE" STACK_SUBCOMMAND=config ./scripts/deploy-stack.sh
ENV_FILE="$REMOTE_ENV_FILE" ./scripts/deploy-stack.sh

if [ -n "${BACKEND_IMAGE:-}" ]; then
  for attempt in $(seq 1 30); do
    current_image=$(docker service inspect --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' "$BACKEND_SERVICE_NAME" 2>/dev/null || true)
    case "$current_image" in
      "$BACKEND_IMAGE"|"$BACKEND_IMAGE"@*)
        echo "$BACKEND_SERVICE_NAME now targets image $current_image"
        break
        ;;
    esac

    echo "Waiting for $BACKEND_SERVICE_NAME to target $BACKEND_IMAGE (attempt $attempt/30)"

    if [ "$attempt" -eq 30 ]; then
      echo "Timed out waiting for $BACKEND_SERVICE_NAME to target image $BACKEND_IMAGE" >&2
      docker service inspect "$BACKEND_SERVICE_NAME"
      exit 1
    fi

    sleep 2
  done
fi

for attempt in $(seq 1 120); do
  replicas=$(docker service ls --filter name="$BACKEND_SERVICE_NAME" --format '{{.Replicas}}' 2>/dev/null || true)
  actual=${replicas%/*}
  desired=${replicas#*/}

  if [ -n "$actual" ] && [ "$actual" = "$desired" ] && curl --fail --silent --show-error --max-time 5 "$BACKEND_HEALTH_URL" >/dev/null; then
    echo "$BACKEND_SERVICE_NAME is healthy with replicas ${replicas:-unknown}"
    break
  fi

  echo "Waiting for $BACKEND_SERVICE_NAME health (attempt $attempt/120, replicas=${replicas:-unknown})"

  if [ "$attempt" -eq 120 ]; then
    echo "Timed out waiting for $BACKEND_SERVICE_NAME to become healthy" >&2
    docker service ps "$BACKEND_SERVICE_NAME" --no-trunc
    docker service logs --tail 200 "$BACKEND_SERVICE_NAME"
    exit 1
  fi

  sleep 2
done

cd "$REPO_ROOT/FindIt_frontend"
# Production uses same-origin API and WebSocket defaults, so stale Vite env
# overrides from previous manual builds must not leak into the published bundle.
rm -f .env .env.local .env.production .env.production.local
# npm ci can fail to clean long-lived frontend node_modules trees on the server.
rm -rf node_modules dist
npm ci
npm run build

cd "$REPO_ROOT"
./deploy/frontend/publish-static.sh

sudo install -m 644 "$REPO_ROOT/deploy/nginx/findit.conf" /etc/nginx/sites-available/findit
sudo ln -sf /etc/nginx/sites-available/findit /etc/nginx/sites-enabled/findit
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

curl --fail --silent --show-error --max-time 5 "$BACKEND_HEALTH_URL" >/dev/null
curl --fail --silent --show-error --max-time 5 "$PUBLIC_BACKEND_HEALTH_URL" >/dev/null
curl --fail --silent --show-error --max-time 5 "$PUBLIC_FRONTEND_URL" >/dev/null

docker service ps "$BACKEND_SERVICE_NAME" --no-trunc
echo "Production deploy completed successfully"
