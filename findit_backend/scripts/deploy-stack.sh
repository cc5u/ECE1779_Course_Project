#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

STACK_FILE=${STACK_FILE:-"$PROJECT_DIR/docker-stack.yml"}
ENV_FILE=${ENV_FILE:-"$PROJECT_DIR/.env.stack"}
STACK_SUBCOMMAND=${STACK_SUBCOMMAND:-deploy}

if [ ! -f "$STACK_FILE" ]; then
  echo "Missing stack file: $STACK_FILE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Copy $PROJECT_DIR/.env.stack.example to .env.stack and fill in the real values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

STACK_NAME=${STACK_NAME:-findit}

case "$STACK_SUBCOMMAND" in
  deploy)
    docker stack deploy -c "$STACK_FILE" "$STACK_NAME"
    ;;
  config)
    docker stack config -c "$STACK_FILE"
    ;;
  *)
    echo "Unsupported STACK_SUBCOMMAND: $STACK_SUBCOMMAND" >&2
    echo "Use STACK_SUBCOMMAND=deploy or STACK_SUBCOMMAND=config." >&2
    exit 1
    ;;
esac
