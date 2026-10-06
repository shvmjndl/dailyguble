#!/usr/bin/env bash
# Runs The Daily Guble on this machine at http://localhost:8080
#
#   ./run.sh            use Node if it's installed (v20+), otherwise Docker
#   ./run.sh --docker   always use Docker
#   PORT=3000 ./run.sh  use another port
#
# The first run asks you to choose the admin password and saves only its hash in .env.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8080}"
IMAGE="daily-guble:local"
MODE="auto"
[[ "${1:-}" == "--docker" ]] && MODE="docker"

have() { command -v "$1" >/dev/null 2>&1; }
node_ok() { have node && [[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ]]; }

if [[ "$MODE" == "auto" ]]; then
  if node_ok; then MODE="node"
  elif have docker; then MODE="docker"
  else echo "Install Node.js 20 or newer, or Docker, then run this again." >&2; exit 1
  fi
fi
if [[ "$MODE" == "docker" ]] && ! have docker; then
  echo "Docker isn't installed. Install it, or run ./run.sh without --docker to use Node." >&2; exit 1
fi

# Read one KEY=value from .env without executing the file.
env_get() { awk -F= -v k="$1" '$1 == k { sub(/^[^=]*=/, ""); v = $0 } END { print v }' .env; }

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

if [[ "$MODE" == "docker" ]]; then
  echo "Building the Docker image..."
  docker build -q -t "$IMAGE" . >/dev/null
fi

# First run: choose the admin password. Only its scrypt hash is saved.
if [[ -z "$(env_get ADMIN_PASSWORD_HASH)" ]]; then
  echo "Choose a password for the newsroom at /admin (at least 12 characters)."
  while true; do
    read -rsp "New admin password: " pw1; echo
    read -rsp "Type it again: " pw2; echo
    if [[ "$pw1" != "$pw2" ]]; then echo "Those don't match. Try again."; continue; fi
    if [[ ${#pw1} -lt 12 ]]; then echo "Use at least 12 characters. A few random words work well."; continue; fi
    break
  done
  # The password goes in on stdin, never as an argument, so it can't show up in `ps`.
  if [[ "$MODE" == "node" ]]; then
    line=$(printf '%s\n' "$pw1" | node scripts/hash-password.js | grep '^ADMIN_PASSWORD_HASH=' || true)
  else
    line=$(printf '%s\n' "$pw1" | docker run --rm -i "$IMAGE" node scripts/hash-password.js | grep '^ADMIN_PASSWORD_HASH=' || true)
  fi
  unset pw1 pw2
  if [[ -z "$line" ]]; then echo "Couldn't create the password hash." >&2; exit 1; fi
  tmp=$(mktemp)
  LINE="$line" awk 'BEGIN { done = 0 } /^ADMIN_PASSWORD_HASH=/ { print ENVIRON["LINE"]; done = 1; next } { print } END { if (!done) print ENVIRON["LINE"] }' .env > "$tmp"
  cat "$tmp" > .env && rm -f "$tmp"
  chmod 600 .env
  echo "Saved the password hash in .env."
fi

USERNAME="$(env_get ADMIN_USERNAME)"; USERNAME="${USERNAME:-editor}"
echo
echo "  The paper:     http://localhost:${PORT}"
echo "  The newsroom:  http://localhost:${PORT}/admin   (username: ${USERNAME})"
echo "  Stop with Ctrl+C."
echo

# Plain http on localhost, so the cookie can't be HTTPS-only and there's no proxy in front.
if [[ "$MODE" == "node" ]]; then
  exec env \
    ADMIN_USERNAME="$USERNAME" \
    ADMIN_PASSWORD_HASH="$(env_get ADMIN_PASSWORD_HASH)" \
    HISTORY_KEEP="$(env_get HISTORY_KEEP)" \
    GITHUB_REPO="$(env_get GITHUB_REPO)" GITHUB_TOKEN="$(env_get GITHUB_TOKEN)" \
    GITHUB_BRANCH="$(env_get GITHUB_BRANCH)" GITHUB_DIR="$(env_get GITHUB_DIR)" GITHUB_API_URL="$(env_get GITHUB_API_URL)" \
    GITHUB_AUTHOR_NAME="$(env_get GITHUB_AUTHOR_NAME)" GITHUB_AUTHOR_EMAIL="$(env_get GITHUB_AUTHOR_EMAIL)" \
    SITE_URL="$(env_get SITE_URL)" \
    COOKIE_SECURE=false TRUST_PROXY=false \
    HOST=127.0.0.1 PORT="$PORT" DATA_DIR="$PWD/data" \
    node server.js
else
  exec docker run --rm -it --name daily-guble-local \
    -p "127.0.0.1:${PORT}:8080" \
    --env-file .env -e COOKIE_SECURE=false -e TRUST_PROXY=false \
    -v daily-guble-local-data:/data \
    --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true \
    "$IMAGE"
fi
