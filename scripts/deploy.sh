#!/bin/bash
# Build and (re)start the production stack. Run this after the initial clone
# (see scripts/ec2-user-data.sh) and again after every `git pull` to pick up
# changes — the "logiai" systemd unit only handles restart-on-reboot, not
# rebuilding from source.
set -e

[ -f .env ] || { echo "No .env found — copy .env.sample to .env and configure it first." >&2; exit 1; }

docker compose -f docker-compose.prod.yml --profile with-ollama up -d --build

IP=$(curl -s --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo "Backend:  http://$IP:8000"
echo "Frontend: http://$IP:3000"
