#!/bin/bash
# EC2 "User data" bootstrap for AI_Powered_Logistics_Analytics_Dashboard.
# Paste this whole file into the EC2 launch wizard's User data field
# (Ubuntu 22.04/24.04 AMI). Run once, automatically, on first boot.
#
# What it does: installs Docker + Compose, and registers a systemd unit that
# starts the app stack on every future boot.
#
# What it deliberately does NOT do: clone the repo or embed any credentials.
# User data is readable via the EC2 instance metadata service by anyone with
# access to the box — a private SSH/deploy key has no business being in it.
# The one-time manual clone + `scripts/deploy.sh` step below is done over SSH
# instead, using your own key.
set -euxo pipefail

exec > >(tee -a /var/log/logiai-setup.log) 2>&1

APP_DIR="/opt/logiai"
REPO_DIR="$APP_DIR/AI_Powered_Logistics_Analytics_Dashboard"

apt-get update -y
apt-get install -y ca-certificates curl git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

# So you can run `docker compose ...` over SSH without sudo.
id -u ubuntu &>/dev/null && usermod -aG docker ubuntu || true

mkdir -p "$APP_DIR"

# `up -d` only (no --build) — this unit's job is "make sure the already-built
# stack is running after a reboot," not building from source. Building is
# `scripts/deploy.sh`'s job, run manually after a clone or a `git pull`.
cat > /etc/systemd/system/logiai.service <<EOF
[Unit]
Description=AI Logistics Analytics Dashboard (docker compose)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$REPO_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml --profile with-ollama up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml --profile with-ollama down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# Registers it for future boots — does NOT start it now, since the repo
# doesn't exist yet. The first start happens via `scripts/deploy.sh` below.
systemctl enable logiai.service

cat <<'MSG'

========================================================================
Docker + the "logiai" systemd unit are installed and will auto-start the
app on every future reboot. One manual step remains (SSH in and run it
yourself — never put private keys in user-data):

  1. ssh ubuntu@<this-instance-public-ip>
  2. sudo chown ubuntu:ubuntu /opt/logiai
     cd /opt/logiai
     git clone git@github.com:thinhvo0108/AI_Powered_Logistics_Analytics_Dashboard.git
     cd AI_Powered_Logistics_Analytics_Dashboard
     # (private repo: use a GitHub deploy key or PAT in your own ssh-agent /
     #  git credential store on this box — not in user-data.)
  3. cp .env.sample .env
     # Edit .env for production:
     #   - CORS_ORIGINS and NEXT_PUBLIC_API_URL -> this box's public IP or domain
     #     (NEXT_PUBLIC_API_URL is baked into the frontend at build time —
     #     leaving it as localhost will silently break every API call from
     #     a real browser)
     #   - API_KEYS and NEXT_PUBLIC_API_KEY -> change together from the dev
     #     defaults, and keep them matching each other
  4. bash scripts/deploy.sh
========================================================================

MSG
