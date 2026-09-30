#!/bin/sh
# Installs SaaS Monitor with Docker Compose, without cloning the repository:
#
#   curl -fsSL https://saas-monitor.com/install.sh | sh
#
# Creates a `saas-monitor` folder (or the one given with `sh -s -- <folder>`) holding the Compose
# file and a `.env` with fresh secrets, then says how to start. Nothing else on the machine is
# touched, and nothing runs until you start it. `APP_URL=https://monitor.example.com sh` sets the
# address the app is opened at. The same steps by hand, in the self-hosting guide:
# https://github.com/Synapsr/SaaS-Monitor/blob/main/docs/self-hosting.md
set -eu

SOURCE_URL="https://raw.githubusercontent.com/Synapsr/SaaS-Monitor/main"
GENERATED_SECRETS="AUTH_SECRET ENCRYPTION_KEY MYSQL_PASSWORD MYSQL_ROOT_PASSWORD"
APP_URL="${APP_URL:-}"

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

# 32 random bytes as 64 hex characters, the format ENCRYPTION_KEY requires. `od` covers the
# minimal systems that have no openssl.
secret() {
  openssl rand -hex 32 2>/dev/null || od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
}

is_generated() {
  for key in $GENERATED_SECRETS; do
    [ "$1" = "$key=" ] && return 0
  done
  return 1
}

# Everything runs from here, so that a download cut short never runs half of the script.
main() {
  directory="${1:-saas-monitor}"

  command -v curl >/dev/null 2>&1 || fail "curl is required."
  docker compose version >/dev/null 2>&1 ||
    fail "Docker with Compose is required: https://docs.docker.com/get-started/get-docker/"
  case "$APP_URL" in
    "" | http://* | https://*) ;;
    *) fail "APP_URL must start with http:// or https://, such as http://192.168.1.20:3000." ;;
  esac

  # An existing .env holds the key that encrypts the Stripe keys: never replace it.
  if [ -e "$directory/.env" ] || [ -e "$directory/compose.yaml" ]; then
    fail "$directory already holds an installation, nothing changed. To update it: cd $directory && docker compose pull && docker compose up -d"
  fi

  # Both files are downloaded before anything is written: a failed download leaves nothing behind.
  compose=$(curl -fsSL "$SOURCE_URL/compose.yaml")
  template=$(curl -fsSL "$SOURCE_URL/.env.example")

  mkdir -p "$directory"
  cd "$directory"
  printf '%s\n' "$compose" >compose.yaml
  umask 077
  printf '%s\n' "$template" | while IFS= read -r line; do
    if is_generated "$line"; then
      line="$line$(secret)"
    elif [ -n "$APP_URL" ] && [ "${line%%=*}" = "APP_URL" ]; then
      line="APP_URL=$APP_URL"
    fi
    printf '%s\n' "$line"
  done >.env

  address=$(sed -n 's/^APP_URL=//p' .env)
  cat <<EOF
SaaS Monitor is ready in $directory: compose.yaml, and .env with fresh secrets.

Start it:
  cd $directory && docker compose up -d

Then open $address and create your account.
Keep .env safe: its ENCRYPTION_KEY encrypts the Stripe keys you connect.
EOF
  if [ -z "$APP_URL" ]; then
    cat <<EOF

To open the app and its screens from other devices, such as a TV, first set APP_URL in
$directory/.env to the address they will use (http://192.168.1.20:3000, or your domain):
screen links are built from it.
EOF
  fi
  printf '\nGuide: https://github.com/Synapsr/SaaS-Monitor/blob/main/docs/self-hosting.md\n'
}

main "$@"
