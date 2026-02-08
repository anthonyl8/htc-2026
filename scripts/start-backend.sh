#!/usr/bin/env bash
# Run ReLeaf backend (FastAPI) on http://localhost:8000
set -e
cd "$(dirname "$0")/../backend"

if [[ -d .venv ]]; then
  source .venv/bin/activate
else
  echo "No .venv found. Create one with: python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

echo "Starting backend at http://localhost:8000"
exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
