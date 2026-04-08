# Operations, backup, and disaster recovery

This document is a **starting point** for running TeamConect in production. Adjust RTO/RPO, vendors, and procedures to your org.

## Backups (PostgreSQL)

- **Managed providers (Neon, Supabase, RDS, etc.)**  
  Enable automated backups in the provider console. Note retention, point-in-time recovery (PITR) availability, and restore steps.

- **Self-hosted Postgres**  
  Use nightly logical dumps (e.g. `pg_dump`) and/or filesystem/WAL archiving. Store copies off-site (object storage in another region).

- **What to protect**  
  The Prisma schema lives in git; the **database** holds user accounts, ideas, applications, and admin content. Treat backups as mandatory before major migrations.

## Restore drill (recommended quarterly)

1. Restore a backup to a **non-production** database (new instance or branch).
2. Point a **staging** app at that database (read-only user optional).
3. Run `npx prisma migrate deploy` if schema drift is possible, then smoke-test auth and one critical flow.
4. Record actual **time to restore** and gaps.

## RTO / RPO (fill in)

| Metric | Target (your org) | Notes |
|--------|-------------------|--------|
| RPO (max acceptable data loss) | e.g. 1 h / 24 h | Driven by backup frequency |
| RTO (max downtime) | e.g. 1 h / 4 h | App + DNS + DB restore |

## Application secrets

- Store `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, Upstash tokens, and Sentry keys in the host’s **secret manager** (not in git).
- Rotate `NEXTAUTH_SECRET` only with a planned session invalidation strategy.

## Health and monitoring

- **`GET /api/health`**: returns JSON `{ status, database, ts }` — HTTP **200** when PostgreSQL answers `SELECT 1`, **503** if not. Point uptime monitors here (or protect it behind your edge if you prefer not to expose it publicly).
- **Sentry**: errors and performance when DSN is set.
- **PostHog**: product analytics when key is set.
- **Admin console**: internal stats endpoint (authenticated admin only).

## Scaling reminders

- See [SCALING.md](./SCALING.md) for Redis, rate limits, and connection pooling.
- For **multiple app instances**, set `UPSTASH_REDIS_*` or turn on `REQUIRE_UPSTASH_IN_PRODUCTION=1` so rate limits stay consistent (see `.env.example`).

## Incident checklist (outline)

1. Confirm scope (app only vs database vs third party).
2. Roll back bad deploy if applicable; otherwise fail over / restore DB per runbook.
3. Communicate to users if data or auth was affected.
4. Post-incident: timeline, root cause, preventive actions.
