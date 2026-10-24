#!/usr/bin/env bash
# REEVITA — fail-closed staging release gate.
#
# Refuses to touch anything unless the operator proves the target is staging:
#   STAGING_CONFIRM=I-UNDERSTAND-THIS-IS-STAGING
#   STAGING_PROJECT_REF=<20-char project ref>
#   STAGING_DB_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
#   PRODUCTION_PROJECT_REF=<ref>   (optional but recommended: blocks a swap)
#
# Usage:
#   ./scripts/staging-gate.sh --dry-run     # print the plan, connect to nothing
#   ./scripts/staging-gate.sh               # backup -> apply -> verify -> API checks
#   ./scripts/staging-gate.sh --skip-backup # only when a recent backup already exists
#
# Exit codes: 2 bad/missing identity env · 3 staging==production · 4 DB URL mismatch
#             5 missing tool · 6 backup failed · 7 migration/verification failed · 8 API checks failed
set -euo pipefail

CONFIRM_TOKEN="I-UNDERSTAND-THIS-IS-STAGING"
MIGRATION_IDS=(000008 000009 000010 000011 000012)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${HOME:-/tmp}/reevita-staging-backups}"

DRY_RUN=0
SKIP_BACKUP=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-backup) SKIP_BACKUP=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 64 ;;
  esac
done

die() { echo "GATE REFUSED/FAILED ($1): $2" >&2; exit "$1"; }

info() { echo "== $*"; }

# ---------------------------------------------------------------- 1. identity guards
[ "${STAGING_CONFIRM:-}" = "$CONFIRM_TOKEN" ] \
  || die 2 "STAGING_CONFIRM must be '$CONFIRM_TOKEN' (guards against accidentally targeting production)"
[ -n "${STAGING_PROJECT_REF:-}" ] || die 2 "STAGING_PROJECT_REF is required"
[ -n "${STAGING_DB_URL:-}" ] || die 2 "STAGING_DB_URL is required"

if [ -n "${PRODUCTION_PROJECT_REF:-}" ] && [ "$PRODUCTION_PROJECT_REF" = "$STAGING_PROJECT_REF" ]; then
  die 3 "STAGING_PROJECT_REF equals PRODUCTION_PROJECT_REF — refusing to continue"
fi

case "$STAGING_DB_URL" in
  *"$STAGING_PROJECT_REF"*) ;;
  *) die 4 "STAGING_DB_URL does not reference project '$STAGING_PROJECT_REF' — refusing to continue" ;;
esac

MIGRATION_FILES=()
for id in "${MIGRATION_IDS[@]}"; do
  file=$(find "$ROOT_DIR/supabase/migrations" -maxdepth 1 -name "*${id}_*.sql" | sort | head -n 1)
  [ -n "$file" ] || die 5 "migration $id not found in supabase/migrations"
  MIGRATION_FILES+=("$file")
done

# ---------------------------------------------------------------- 2. plan / dry run
info "Target project ref : $STAGING_PROJECT_REF"
info "Backup directory   : $BACKUP_DIR"
info "Migrations (order) :"
for file in "${MIGRATION_FILES[@]}"; do echo "   - $(basename "$file")"; done
info "Post-apply gate    : supabase/verification/release_security_checks.sql"
info "Storage API checks : scripts/verify-storage-api.mjs (needs STAGING_*_EMAIL/PASSWORD)"

if [ "$DRY_RUN" -eq 1 ]; then
  info "DRY RUN — nothing was connected, migrated, or modified."
  exit 0
fi

# ---------------------------------------------------------------- 3. tool checks
command -v psql >/dev/null 2>&1 || die 5 "psql is required (install postgresql-client)"
if [ "$SKIP_BACKUP" -eq 0 ]; then
  command -v pg_dump >/dev/null 2>&1 || die 5 "pg_dump is required unless --skip-backup is passed"
fi

# ---------------------------------------------------------------- 4. backup first
if [ "$SKIP_BACKUP" -eq 0 ]; then
  mkdir -p "$BACKUP_DIR"
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  SCHEMA_DUMP="$BACKUP_DIR/staging-${STAGING_PROJECT_REF}-${STAMP}-schema.sql"
  DATA_DUMP="$BACKUP_DIR/staging-${STAGING_PROJECT_REF}-${STAMP}-data.sql"
  info "Backing up schema and data to $BACKUP_DIR"
  pg_dump "$STAGING_DB_URL" --schema-only --no-owner --no-privileges -f "$SCHEMA_DUMP" \
    || die 6 "schema backup failed — aborting before any migration"
  pg_dump "$STAGING_DB_URL" --data-only --no-owner -f "$DATA_DUMP" \
    || die 6 "data backup failed — aborting before any migration"
  info "Backup written: $(basename "$SCHEMA_DUMP"), $(basename "$DATA_DUMP")"
else
  info "WARNING: --skip-backup passed; no backup was taken in this run"
fi

# ---------------------------------------------------------------- 5. preflight (read-only)
info "Recording current object state (read-only)"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f "$ROOT_DIR/supabase/verification/staging_preflight.sql" \
  || die 7 "preflight query failed; stopping before any change"

# ---------------------------------------------------------------- 6. apply in order
for file in "${MIGRATION_FILES[@]}"; do
  info "Applying $(basename "$file")"
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f "$file" \
    || die 7 "migration $(basename "$file") failed"
done

# ---------------------------------------------------------------- 7. security gate
info "Running release security checks (fail-fast)"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 \
  -f "$ROOT_DIR/supabase/verification/release_security_checks.sql" \
  || die 7 "release security checks FAILED — treat Storage/RLS as unverified"

# ---------------------------------------------------------------- 8. storage API checks
if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_ANON_KEY:-}" ] \
   && [ -n "${STAGING_CUSTOMER_EMAIL:-}" ] && [ -n "${STAGING_ADMIN_EMAIL:-}" ]; then
  info "Running Storage API authorisation checks"
  node "$ROOT_DIR/scripts/verify-storage-api.mjs" || die 8 "storage API authorisation checks FAILED"
else
  info "BLOCKED: Storage API checks skipped (need SUPABASE_URL, SUPABASE_ANON_KEY,"
  info "         STAGING_CUSTOMER_EMAIL/PASSWORD, STAGING_ADMIN_EMAIL/PASSWORD)"
fi

cat <<'SUMMARY'

== GATE SUMMARY
DATABASE   : migrations applied and release_security_checks.sql passed
STORAGE    : verified only if the API section above reported PASS
NOT COVERED: authenticated login/session/recovery, COD checkout, concurrency,
             admin UI flows, Upstash rate limiting, monitoring.
Complete those with docs/STAGING_MIGRATION_PLAN.md §6 before any production change.
SUMMARY
