# Production readiness checklist

Use this before launch and on a recurring schedule (e.g. quarterly). **No checklist guarantees “100% readiness”** — external factors (legal, vendor incidents, novel attacks) always remain. This document maximizes what you can verify in engineering and operations.

## Automated gates (repository)

- [ ] **`npm run lint`** passes in CI  
- [ ] **`npm test`** (unit) passes  
- [ ] **`npm run test:integration`** passes with `TEST_DATABASE_URL` (also runs in GitHub Actions with Postgres)  
- [ ] **`npm run build`** passes  
- [ ] **`npm run test:e2e`** passes against a running build (smoke + health + key pages in CI)  

## Security

- [ ] Secrets only in host secret store — never committed  
- [ ] `NEXTAUTH_SECRET` ≥ 32 random characters; rotation plan documented  
- [ ] `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` match the canonical public URL  
- [ ] HTTPS end-to-end; HSTS at the edge  
- [ ] Review [SECURITY.md](./SECURITY.md) checklist; schedule periodic dependency updates (Dependabot enabled)  
- [ ] Optional: external penetration test before high-stakes launch  

## Infrastructure

- [ ] PostgreSQL: backups + tested restore (see [OPERATIONS.md](./OPERATIONS.md))  
- [ ] Pooled `DATABASE_URL` for serverless if applicable  
- [ ] **Upstash Redis** in production if you run **more than one app instance**, or set `REQUIRE_UPSTASH_IN_PRODUCTION=1`  
- [ ] **Resend** (or equivalent) configured for production email; domain verified  
- [ ] Error monitoring (Sentry) and optional analytics (PostHog) configured  
- [ ] **Readiness URL**: `GET /api/health` returns 200 when the database is reachable (use behind auth or private network if you prefer)  

## Application headers

Global security headers are set in `next.config.mjs` (frame options, nosniff, referrer policy, permissions policy). Revisit **Content-Security-Policy** if you add new third-party scripts.

## Legal & compliance

- [ ] Privacy policy and terms published  
- [ ] [COMPLIANCE.md](./COMPLIANCE.md) reviewed with counsel / DPO  
- [ ] Data processing agreements with subprocessors (host, DB, email, Redis, Sentry, PostHog)  

## Launch day

- [ ] Run migrations: `npx prisma migrate deploy`  
- [ ] Smoke-test sign-in, one critical user journey, admin login (if used)  
- [ ] Confirm `/api/health` and monitoring alerts  

## After launch

- [ ] Incident runbook location known to on-call  
- [ ] Post-mortems for production incidents  
- [ ] Re-run this checklist after major architecture or auth changes  

---

**About “100/100”:** A perfect score would require infinite verification. Treat this checklist as **sufficient for a disciplined production launch** when combined with your org’s risk tolerance, legal review, and monitoring.
