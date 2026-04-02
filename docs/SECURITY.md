# Security review and hardening

Use this as a **checklist** before a serious launch or before/after a penetration test. It does not replace a professional assessment.

## Pre-launch / periodic review

- [ ] **Secrets**: No secrets in git; production env only via host secrets.
- [ ] **HTTPS**: TLS everywhere; HSTS at the edge (e.g. Cloudflare / Vercel).
- [ ] **Auth**: `NEXTAUTH_URL` matches canonical URL; `NEXTAUTH_SECRET` ≥ 32 random bytes.
- [ ] **Database**: Pooled connection string for serverless; least-privilege DB user for the app.
- [ ] **Redis**: Upstash enabled in multi-instance production (`REQUIRE_UPSTASH_IN_PRODUCTION=1` optional enforcement).
- [ ] **Email**: Resend domain verified; SPF/DKIM as per Resend docs.
- [ ] **Dependencies**: `npm audit`, Dependabot or Renovate, patch critical CVEs quickly.
- [ ] **Admin**: Admin role granted only to trusted accounts; audit sensitive admin actions (see `AuditLog` usage in product).

## Application controls (implemented in code)

- Zod validation on API bodies; session checks on mutations.
- Rate limiting: API + auth (OTP) + waitlist (see `src/lib/ratelimit.ts`, `rate-limit.ts`).
- Email OTP: per-IP and per-email caps.
- Production env validation: `src/lib/env-server.ts` (invoked from `instrumentation.ts`).
- **HTTP security headers** (see `next.config.mjs`): `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on app routes; extend with **Content-Security-Policy** if you add more third-party scripts.
- **Readiness**: `GET /api/health` probes the database (treat as sensitive if exposed without edge protection).

## Penetration test scope (suggested)

When engaging a tester, include:

1. **Auth**: OAuth, email OTP, session fixation, logout.
2. **Authorization**: IDOR on ideas, applications, founder profiles, admin APIs.
3. **Abuse**: Rate-limit bypass, waitlist spam, OTP brute force (should be limited).
4. **Headers**: CSP, X-Frame-Options, referrer policy (may be partially set by host).

## After a pen test

- Track findings in your issue tracker with severity.
- Re-test fixes; update this doc with “last assessed” date and scope.

## Reporting vulnerabilities

Publish a security contact (e.g. `security@yourdomain.com`) or use GitHub Security Advisories if the repo is public.
