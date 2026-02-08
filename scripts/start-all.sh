#!/usr/bin/env bash
# Start ReLeaf backend and frontend from project root.
# Usage: ./scripts/start-all.sh   (run from htc-2026/)
set -e
cd "$(dirname "$0")/.."

BACKEND_PID=""
cleanup() {
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

VENV_DIR=""
[[ -d backend/.venv ]] && VENV_DIR="backend/.venv"
[[ -z "$VENV_DIR" && -d backend/venv ]] && VENV_DIR="backend/venv"

if [[ -n "$VENV_DIR" ]]; then
  (cd backend && source "$(basename "$VENV_DIR")/bin/activate" && pip install -q -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000) &
  BACKEND_PID=$!
  echo "Backend started (PID $BACKEND_PID) at http://localhost:8000"
  sleep 3
else
  echo "No backend venv found. Create one with:"
  echo "  cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

cd frontend
[[ -d node_modules ]] || npm install
echo "Frontend at http://localhost:5173"
exec npm run dev
