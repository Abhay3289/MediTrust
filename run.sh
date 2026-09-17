#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d "$ROOT/backend/venv" ]; then echo "Run ./setup.sh first."; exit 1; fi
( cd "$ROOT/backend" && source venv/bin/activate && uvicorn app.main:app --reload --port 8000 ) &
BACKEND_PID=$!
( cd "$ROOT/frontend" && npm run dev -- --host 127.0.0.1 ) &
FRONTEND_PID=$!
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT INT TERM
wait
