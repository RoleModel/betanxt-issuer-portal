#!/usr/bin/env bash
# One-time / repeatable local environment bootstrap.
#
# Runs the full sequence a new machine needs to go from a fresh clone to a
# working `pnpm dev`: dependency install, the local workspace package build
# that `pnpm install` does not trigger on its own, Docker/Supabase startup,
# and a schema-first database reset. See CLAUDE.md "Local Development Setup"
# for the manual version of these steps.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
die() { printf '\n\033[1;31merror:\033[0m %s\n' "$1" >&2; exit 1; }

# --- 1. Prerequisites ------------------------------------------------------

command -v node >/dev/null 2>&1 || die "Node.js is required (see .node-version)."
command -v corepack >/dev/null 2>&1 || die "corepack is required (ships with Node 16.9+)."
command -v docker >/dev/null 2>&1 || die "Docker is required for the local Supabase stack."
java -version >/dev/null 2>&1 || die "A Java runtime is required by openapi-generator-cli (used to
generate the Postgres schema from openapi.yaml). Install one, e.g. 'brew install openjdk'
(macOS) and follow its post-install symlink/PATH instructions, then re-run this script."

log "Enabling corepack / pnpm"
corepack enable

if [ -z "${GITHUB_TOKEN:-}" ]; then
  die "GITHUB_TOKEN is not set. @rolemodel/betanxt-design-system is fetched from GitHub
Packages and needs a classic PAT with the read:packages scope. See README.md
'Authenticating to GitHub Packages' before re-running this script."
fi

log "Checking Docker daemon"
if ! docker info >/dev/null 2>&1; then
  if [ "$(uname)" = "Darwin" ]; then
    log "Docker daemon not responding, launching Docker Desktop"
    open -a Docker
    printf 'Waiting for Docker to start'
    for _ in $(seq 1 60); do
      docker info >/dev/null 2>&1 && break
      printf '.'
      sleep 2
    done
    echo
  fi
  docker info >/dev/null 2>&1 || die "Docker daemon is not running. Start Docker Desktop and re-run this script."
fi

# --- 2. Install dependencies ------------------------------------------------

log "pnpm install"
pnpm install

# --- 3. Build the local client-theming workspace package --------------------
# @rolemodel/client-theming is consumed via workspace:* (see README), so its
# TypeScript source must be compiled to dist/ locally — pnpm install does not
# do this for us, and dist/ is gitignored build output.

log "Building @rolemodel/client-theming"
pnpm --filter @rolemodel/client-theming run build

# --- 4. Local env files -----------------------------------------------------
# issuer-portal's template is filled in from its own external-service secrets
# (Brandfetch, Resend, MUI license, ...) that only a human can supply, so it's
# just copied as a starting point. mock-api-server's local Supabase URL/keys,
# by contrast, are knowable in advance — the Supabase CLI always uses the same
# fixed local demo keys — so step 6 below writes them for real instead of
# leaving the template's non-functional supabase.co placeholders in place.

if [ ! -f issuer-portal/.env.local ]; then
  log "Creating issuer-portal/.env.local from template"
  cp issuer-portal/env.template issuer-portal/.env.local
else
  log "issuer-portal/.env.local already exists, leaving it as-is"
fi

# --- 5. Generate the schema/seed BEFORE first Supabase start ----------------
# supabase/migrations and supabase/seed.sql are gitignored generated
# artifacts (see .gitignore), so a fresh clone has neither. `supabase start`
# auto-applies migrations and auto-seeds on its very first bootstrap of a
# volume; if that first boot finds no migrations, it seeds against an empty
# schema, fails, and tears the containers back down (confirmed while
# debugging this script). Generating the schema/seed first, before Supabase
# has ever started, avoids that failure mode entirely.

log "Generating Postgres schema from OpenAPI spec"
pnpm --filter mock-api-server run generate:postgres-schema

log "Generating seed data"
pnpm --filter mock-api-server run generate:seeds

# --- 6. Local Supabase stack -------------------------------------------------

log "Starting local Supabase"
pnpm --filter mock-api-server run supabase:start

log "Writing mock-api-server/.env.local with local Supabase credentials"
SUPABASE_ENV="$(pnpm --filter mock-api-server exec supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
LOCAL_API_URL="$(printf '%s\n' "$SUPABASE_ENV" | grep '^API_URL=' | cut -d= -f2- | tr -d '"')"
LOCAL_ANON_KEY="$(printf '%s\n' "$SUPABASE_ENV" | grep '^ANON_KEY=' | cut -d= -f2- | tr -d '"')"
LOCAL_SERVICE_ROLE_KEY="$(printf '%s\n' "$SUPABASE_ENV" | grep '^SERVICE_ROLE_KEY=' | cut -d= -f2- | tr -d '"')"
cat > mock-api-server/.env.local <<EOF
SUPABASE_URL=${LOCAL_API_URL}
SUPABASE_ANON_KEY=${LOCAL_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${LOCAL_SERVICE_ROLE_KEY}
NEXT_PUBLIC_SUPABASE_URL=${LOCAL_API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${LOCAL_ANON_KEY}
NEXT_PUBLIC_BYPASS_AUTH=true
PORT=3001
EOF

# --- 7. Schema-first database reset -----------------------------------------
# Re-generates schema/seeds (idempotent, cheap) and this time also applies
# them with `supabase db reset` against the now-running stack, then
# regenerates DB/API types and reseeds documents.

log "Running full database reset (schema, seeds, types, documents)"
pnpm --filter mock-api-server run full-reset

log "Setup complete. Run 'pnpm dev' to start the portal (:3000) and mock API (:3001)."
