# TeamConnect

**Co-founder matching & community**

Find your co-founder. Build what matters.

## Features

- **Co-Founders**: Founder profiles, startup ideas board, apply to join teams, filters by country/stage/role; **team workspaces** (discussion, shared links, meetings) open when a founder **accepts** an applicant
- **Community**: Tech events calendar (members can post hackathons, conferences, meetups, etc.; admins can curate)
- **i18n**: English, French, Arabic (RTL), Spanish, German, Italian, Portuguese, Russian, Chinese (Simplified), Japanese, Ukrainian — browser locale detection + language switcher
- **Auth**: NextAuth with Google, GitHub, and email OTP; transactional email via **Gmail SMTP** (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) or Resend (sign-in codes, waitlist, application alerts)

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` (PostgreSQL, e.g. Supabase/Neon)
   - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
   - OAuth: `GOOGLE_*`, `GITHUB_*` (create apps in each provider; GitHub callback URL is `{NEXTAUTH_URL}/api/auth/callback/github`)
   - **Production email OTP:** set `EMAIL_TRANSPORT=smtp`, `EMAIL_SMTP_ONLY=1`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` (Google [App Password](https://support.google.com/accounts/answer/185833)), and `EMAIL_FROM` (e.g. `TeamConnect <you@gmail.com>`). On Vercel, add these under Project → Settings → Environment Variables and redeploy.
   - Optional Resend: `RESEND_API_KEY`, `EMAIL_FROM` (without any mail provider, dev logs OTP to the server console only)

2. Install and apply the database schema:
   ```bash
   npm install
   npx prisma generate
   ```
   **Existing database** (upgrading from the old jobs/freelance schema): apply migrations, then seed:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   **Empty database** (or you prefer push over migrations):
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   The migration `20250401130000_remove_jobs_freelance` drops `Application`, `Job`, `Company`, `FreelanceProject`, `FreelancerProfile`, and `Profile`, and updates `UserRole` / `AccountType` enums.

3. Run:
   ```bash
   npm run dev
   ```

## Tests

```bash
npm test
```

- **Unit / fast**: Vitest (`src/**/*.test.ts`) — OTP, rate-limit helpers, admin gate, API body schemas, production env rules.
- **Integration** (PostgreSQL + route handlers): set `TEST_DATABASE_URL` to a database with migrations applied, then:
  ```bash
  export TEST_DATABASE_URL="postgresql://..."
  npm run test:integration
  ```
  Skips automatically if `TEST_DATABASE_URL` is unset.
- **E2E** (Playwright): with the dev server reachable at `http://127.0.0.1:3000` (or set `E2E_BASE_URL`):
  ```bash
  npx playwright install chromium   # once per machine
  npm run test:e2e
  ```
  Use `E2E_SKIP_SERVER=1` when the app is already running; set `E2E_BASE_URL` for a deployed preview.

Operational checklists: [docs/OPERATIONS.md](docs/OPERATIONS.md), [docs/SECURITY.md](docs/SECURITY.md), [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

Full launch audit: **[docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)** (explains why “100% ready” is never fully provable in software — external legal review, pen tests, and incidents always remain).

## CI (GitHub Actions)

`.github/workflows/ci.yml` runs on push and pull requests to `main` / `master`:

1. **Lint, unit tests, production build** (placeholder `DATABASE_URL` for Prisma generate only).  
2. **Postgres service** → `prisma migrate deploy` → **integration tests** → **build** → **Playwright E2E** against `next start` (uses `GET /api/health` as readiness).

`.github/dependabot.yml` opens weekly **npm** and monthly **GitHub Actions** update PRs.

Optional badge (replace `OWNER` / `REPO`):

```markdown
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
```

## Production checklist (short)

- **Database:** Pooled `DATABASE_URL` for serverless; `npx prisma migrate deploy` on deploy; optional **`GET /api/health`** for probes.
- **Auth:** Strong `NEXTAUTH_SECRET`; `NEXTAUTH_URL` must match the public site URL.
- **Email:** For Gmail-only OTP, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_TRANSPORT=smtp`, `EMAIL_SMTP_ONLY=1`, `EMAIL_FROM`. Or use `RESEND_API_KEY` with a verified domain.
- **Redis:** `UPSTASH_REDIS_*` when running more than one app instance (or `REQUIRE_UPSTASH_IN_PRODUCTION=1`).
- **Observability:** Sentry / PostHog when keys are set.

Local integration DB: `docker compose -f docker-compose.test.yml up -d` (see file header for `TEST_DATABASE_URL`).

## Grant Admin Role

To access the admin panel, add `ADMIN` to a user's roles in the database:

```sql
UPDATE "User" SET roles = array_append(roles, 'ADMIN') WHERE email = 'your@email.com';
```

Or use Prisma Studio: `npm run db:studio`

After the first deploy with the admin expansion migration, admins can **promote other admins**, **disable accounts**, **browse ideas/applications/waitlist**, **export waitlist CSV**, **soft-delete ideas**, **feature ideas** (listed ahead on the public ideas feed), **add or remove community events**, **publish site announcements**, and review the **audit log** — all from **Dashboard → Admin** (tabbed console).

Apply new migrations when upgrading:

```bash
npx prisma migrate deploy
```

## Scripts

- `npm run dev` — Start dev server
- `npm test` — Unit tests (Vitest)
- `npm run test:integration` — DB + route integration tests (`TEST_DATABASE_URL`)
- `npm run test:e2e` — Playwright (see Tests above)
- `npm run build` — Build for production
- `npm run db:push` — Push schema to DB
- `npm run db:seed` — Seed sample data
- `npm run db:studio` — Open Prisma Studio
