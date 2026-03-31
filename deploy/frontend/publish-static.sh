#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

SOURCE_DIR=${1:-"$REPO_ROOT/FindIt_frontend/dist"}
TARGET_DIR=${2:-/var/www/findit}

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Frontend build directory not found: $SOURCE_DIR" >&2
  echo "Run 'npm ci && npm run build' in FindIt_frontend first." >&2
  exit 1
fi

sudo mkdir -p "$TARGET_DIR"
sudo rsync -a --delete "$SOURCE_DIR"/ "$TARGET_DIR"/

echo "Published frontend to $TARGET_DIR"
