#!/bin/bash
set -e

[ -f .env ] || { cp .env.sample .env; echo "Created .env — fill in values before re-running."; exit 1; }

docker compose up --build -d

echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
