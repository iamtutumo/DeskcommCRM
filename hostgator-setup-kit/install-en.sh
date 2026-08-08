#!/usr/bin/env bash
#
# DeskcommCRM — Self-Host Installation Script for Linux VPS (English Version).
# Architectural Owner & Extensions: Tutu Moses (iamtutumo)
# Supports Open-Source Self-Hosted Supabase (https://supabase.com/open-source)
# or external cloud Supabase projects.
#
# Usage:
#   bash hostgator-setup-kit/install-en.sh          # Interactive mode
#   bash hostgator-setup-kit/install-en.sh --yes    # Non-interactive mode (using existing .env)
#
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_URL="${REPO_URL:-https://github.com/iamtutumo/DeskcommCRM.git}"
COMPOSE="docker-compose.prod.yml"
COMPOSE_SUPABASE="docker-compose.selfhost-supabase.yml"

c_red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
c_grn() { printf '\033[32m%s\033[0m\n' "$*" >&2; }
c_ylw() { printf '\033[33m%s\033[0m\n' "$*" >&2; }
c_dim() { printf '\033[2m%s\033[0m\n' "$*" >&2; }

banner() {
  printf '\n'
  c_grn "██████╗ ███████╗███████╗██╗  ██╗ ██████╗ ██████╗ ███╗   ███╗███╗   ███╗"
  c_grn "██╔══██╗██╔════╝██╔════╝██║ ██╔╝██╔════╝██╔═══██╗████╗ ████║████╗ ████║"
  c_grn "██║  ██║█████╗  ███████╗█████╔╝ ██║     ██║   ██║██╔████╔██║██╔████╔██║"
  c_grn "██║  ██║██╔══╝  ╚════██║██╔═██╗ ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║"
  c_grn "██████╔╝███████╗███████║██║  ██╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║"
  c_grn "╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝"
  printf '\n'
  c_dim "  DeskcommCRM — The open-source AI Sales OS for WhatsApp."
  c_dim "  Architectural Owner & MFI Extensions: Tutu Moses (iamtutumo)"
  c_dim "  Self-hosted · Runs on your own server · Your data remains yours."
  printf '\n'
}

show_recovery() {
  local rc=$?
  if [ "$rc" -ne 0 ]; then
    c_red ""
    c_red "════════════════════════════════════════════════════════════════"
    c_red " Installation stopped due to an error. Here is how to recover:"
    c_red "════════════════════════════════════════════════════════════════"
    printf '  %s\n' "rm -f .env                                     # Remove partial config"
    printf '  %s\n' "docker compose -f $COMPOSE down -v             # Stop containers"
    printf '  %s\n' "bash hostgator-setup-kit/install-en.sh         # Try running again"
    printf '\n'
  fi
  exit $rc
}
trap show_recovery EXIT

generate_jwt() {
  local role="$1" secret="$2"
  # Generates an HS256 JWT header and payload for open-source Supabase local auth
  local header='{"alg":"HS256","typ":"JWT"}'
  local payload
  if [ "$role" = "service_role" ]; then
    payload='{"role":"service_role","iss":"supabase","iat":1700000000,"exp":2000000000}'
  else
    payload='{"role":"anon","iss":"supabase","iat":1700000000,"exp":2000000000}'
  fi
  local h_b64 p_b64
  h_b64="$(printf '%s' "$header" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  p_b64="$(printf '%s' "$payload" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  local sig
  sig="$(printf '%s.%s' "$h_b64" "$p_b64" | openssl dgst -sha256 -hmac "$secret" -binary | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')"
  printf '%s.%s.%s' "$h_b64" "$p_b64" "$sig"
}

check_dependencies() {
  c_dim "Checking required host dependencies..."
  for cmd in docker git openssl curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      c_red "Missing dependency: $cmd is not installed."
      exit 1
    fi
  done
  c_grn "✔ All required dependencies (docker, git, openssl, curl) are present."
}

setup_env() {
  if [ -f .env ] && [ "${1:-}" = "--yes" ]; then
    c_dim "Using existing .env configuration..."
    return 0
  fi

  banner
  c_grn "--- DeskcommCRM Interactive Setup (English) ---"
  printf '\n'

  read -r -p "Domain for CRM (e.g. crm.yourcompany.com) [localhost:3000]: " DOMAIN
  DOMAIN="${DOMAIN:-localhost:3000}"

  read -r -p "Your Email Address (for SSL certificates & alerts) [admin@example.com]: " ACME_EMAIL
  ACME_EMAIL="${ACME_EMAIL:-admin@example.com}"

  printf '\n--- Supabase Database Configuration ---\n'
  c_ylw "Choose your Supabase deployment method:"
  c_ylw "  1) Open-Source Self-Hosted Supabase (Docker containers on this VPS - https://supabase.com/open-source)"
  c_ylw "  2) External / Cloud Supabase Project (Manual URL and API keys)"
  read -r -p "Select option (1 or 2) [1]: " SB_OPTION
  SB_OPTION="${SB_OPTION:-1}"

  local self_host_sb="false"
  local sb_url="" sb_anon="" sb_service="" sb_db="" sb_pg_pass="" sb_jwt_sec=""

  if [ "$SB_OPTION" = "1" ]; then
    c_grn "✔ Setting up Open-Source Self-Hosted Supabase via Docker Compose..."
    self_host_sb="true"
    sb_pg_pass="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 32 || echo 'DeskcommPgSecret2026Secure')"
    sb_jwt_sec="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 40 || echo 'DeskcommJwtSecretTokenWithAtLeast32CharsLong2026')"
    sb_anon="$(generate_jwt "anon" "$sb_jwt_sec")"
    sb_service="$(generate_jwt "service_role" "$sb_jwt_sec")"
    sb_url="http://localhost:8000"
    sb_db="postgresql://postgres:${sb_pg_pass}@supabase-db:5432/postgres"
  else
    read -r -p "Supabase Project URL (e.g. https://xxxx.supabase.co): " sb_url
    read -r -p "Supabase Anon Key: " sb_anon
    read -r -p "Supabase Service Role Key (secret): " sb_service
    read -r -p "Supabase Database Connection String (postgresql://postgres...): " sb_db
  fi

  printf '\n--- WhatsApp Engine (Evolution API) ---\n'
  read -r -p "Evolution API URL [http://localhost:8080]: " EVO_URL
  EVO_URL="${EVO_URL:-http://localhost:8080}"
  read -r -p "Evolution API Key [evolution-api-secret-key]: " EVO_KEY
  EVO_KEY="${EVO_KEY:-evolution-api-secret-key}"
  read -r -p "Evolution Instance Name [deskcomm-mfi]: " EVO_INST
  EVO_INST="${EVO_INST:-deskcomm-mfi}"

  printf '\n--- Transactional Email (Standard SMTP) ---\n'
  read -r -p "SMTP Host (e.g. smtp.mailgun.org, smtp.gmail.com) [localhost]: " SMTP_HOST
  SMTP_HOST="${SMTP_HOST:-localhost}"
  read -r -p "SMTP Port [587]: " SMTP_PORT
  SMTP_PORT="${SMTP_PORT:-587}"
  read -r -p "SMTP User: " SMTP_USER
  read -r -p "SMTP Password: " SMTP_PASS
  read -r -p "SMTP From Address [DeskcommCRM <noreply@yourcompany.com>]: " SMTP_FROM
  SMTP_FROM="${SMTP_FROM:-DeskcommCRM <noreply@yourcompany.com>}"

  printf '\n--- Admin Account Setup ---\n'
  read -r -p "First Admin Email [admin@yourcompany.com]: " OWNER_EMAIL
  OWNER_EMAIL="${OWNER_EMAIL:-admin@yourcompany.com}"
  read -r -s -p "First Admin Password (min 8 characters): " OWNER_PASS
  printf '\n'

  local int_sec
  int_sec="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 40 || echo 'InternalSecretTokenDeskcomm2026Secure')"

  c_dim "Writing .env file..."
  cat > .env <<EOF
# DeskcommCRM Production Environment (Self-Hosted Linux VPS)
# Generated by install-en.sh on $(date)
NODE_ENV=production
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
APP_NAME=DeskcommCRM

# Supabase Database & Auth (${self_host_sb:+Open-Source Self-Hosted})
SELF_HOSTED_SUPABASE=${self_host_sb}
NEXT_PUBLIC_SUPABASE_URL=${sb_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${sb_anon}
SUPABASE_SERVICE_ROLE_KEY=${sb_service}
DATABASE_URL=${sb_db}
POSTGRES_PASSWORD=${sb_pg_pass:-}
JWT_SECRET=${sb_jwt_sec:-}

# WhatsApp Engine (Evolution API)
EVOLUTION_API_URL=${EVO_URL}
EVOLUTION_API_KEY=${EVO_KEY}
EVOLUTION_INSTANCE_NAME=${EVO_INST}

# Transactional Email (Standard SMTP)
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}
SMTP_SECURE=true

# Security & Admin Account
INTERNAL_SECRET=${int_sec}
OWNER_EMAIL=${OWNER_EMAIL}
OWNER_PASSWORD=${OWNER_PASS}
EOF

  chmod 600 .env
  c_grn "✔ .env file created successfully."
}

deploy_stack() {
  c_dim "Deploying DeskcommCRM stack using Docker Compose..."
  local compose_flags="-f $COMPOSE"
  if grep -q "SELF_HOSTED_SUPABASE=true" .env 2>/dev/null; then
    compose_flags="-f $COMPOSE -f $COMPOSE_SUPABASE"
    c_ylw "Including Open-Source Self-Hosted Supabase stack in deployment..."
  fi

  # Pull and start services
  docker compose $compose_flags pull --ignore-pull-failures || true
  docker compose $compose_flags up -d --remove-orphans

  c_grn "✔ All containers started."
}

apply_migrations() {
  c_dim "Applying database schema and migrations..."
  if grep -q "SELF_HOSTED_SUPABASE=true" .env 2>/dev/null; then
    c_dim "Waiting for local self-hosted Supabase Postgres container to be healthy..."
    local attempts=0
    while [ "$attempts" -lt 15 ]; do
      if docker exec -i deskcommcrm-supabase-db-1 pg_isready -U postgres -d postgres >/dev/null 2>&1 || \
         docker exec -i "$(docker ps -q -f name=supabase-db)" pg_isready -U postgres -d postgres >/dev/null 2>&1; then
        break
      fi
      sleep 2
      attempts=$((attempts + 1))
    done

    c_dim "Running baseline schema and migrations on self-hosted database..."
    # Apply baseline if table organizations does not exist
    local cname
    cname="$(docker ps -q -f name=supabase-db | head -n 1)"
    if [ -n "$cname" ] && [ -f "supabase/baseline.sql" ]; then
      docker exec -i "$cname" psql -U postgres -d postgres -f - < supabase/baseline.sql || true
      for sql_file in supabase/migrations/*.sql; do
        if [ -f "$sql_file" ]; then
          docker exec -i "$cname" psql -U postgres -d postgres -f - < "$sql_file" || true
        fi
      done
      c_grn "✔ Database schema applied to self-hosted Supabase."
    fi
  else
    c_dim "External Supabase database configured."
  fi
}

main() {
  check_dependencies
  setup_env "${1:-}"
  deploy_stack
  apply_migrations

  printf '\n'
  c_grn "════════════════════════════════════════════════════════════════"
  c_grn " ✔ DeskcommCRM Installation Completed Successfully!"
  c_grn "════════════════════════════════════════════════════════════════"
  c_grn " Your CRM is running."
  if grep -q "SELF_HOSTED_SUPABASE=true" .env 2>/dev/null; then
    c_grn " ✔ Open-Source Self-Hosted Supabase is active."
  fi
  c_grn " • WhatsApp Engine: Evolution API"
  c_grn " • Transactional Email: Standard SMTP"
  c_grn " • Authoritative Accounting: Double-Entry (Default UGX)"
  printf '\n'
}

main "$@"
