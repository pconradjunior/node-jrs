#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

SEA="$DIR/dist/json-rest-server"
if [ -x "$SEA" ]; then
  exec "$SEA" "$@"
fi

if [ ! -d "$DIR/node_modules" ]; then
  echo "[run] node_modules not found. Run: npm install" >&2
  exit 1
fi

exec node "$DIR/bin/jrs.js" "$@"