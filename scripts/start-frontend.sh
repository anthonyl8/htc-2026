#!/usr/bin/env bash
# Run ReLeaf frontend (Vite) on http://localhost:3000
set -e
cd "$(dirname "$0")/../frontend"

if [[ ! -d node_modules ]]; then
  echo "Running npm install..."
  npm install
fi

echo "Starting frontend at http://localhost:3000"
exec npm run dev
