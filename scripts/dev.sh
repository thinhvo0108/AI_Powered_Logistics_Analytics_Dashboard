#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  kill 0
}
trap cleanup EXIT INT TERM

(cd "$ROOT_DIR/backend" && npm run dev) &
(cd "$ROOT_DIR/frontend" && npm run dev) &

wait
