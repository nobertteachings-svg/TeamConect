#!/usr/bin/env bash
# Apply Prisma migrations to the database pointed to by DATABASE_URL.
# Prisma loads .env from the project root automatically.
#
# Supabase tips:
# - If direct db.*.supabase.co:5432 gives P1001, check the project is not paused and try
#   the "Session pooler" URI from Dashboard → Connect (better for prisma migrate than
#   transaction pooler on :6543, which can error with prepared statements).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f prisma/schema.prisma ]; then
  echo "Run this from the TeamConect repo root (prisma/schema.prisma missing)." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ ! -f .env ]; then
  echo "Set DATABASE_URL or create .env with DATABASE_URL=..." >&2
  exit 1
fi

echo "→ prisma migrate deploy (from $ROOT)"
npx prisma migrate deploy
echo "→ Done."
