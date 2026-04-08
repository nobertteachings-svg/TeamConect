# Compliance and privacy (orientation)

**Not legal advice.** This file summarizes **categories of data** the app is designed to handle so your counsel / DPO can map policies (GDPR, CCPA, etc.).

## Typical personal data processed

| Category | Examples in TeamConect |
|----------|-------------------------|
| Identity & account | Name, email, profile image (OAuth), user id |
| Location | Country (ISO2), optional profile fields |
| Professional | Founder/investor/mentor profile text, skills, industries |
| Product usage | PostHog (if enabled), Sentry (if enabled) |
| Communications | Waitlist entries, co-founder application messages, transactional email |

## Roles (high level)

- **Controller**: Your organization operating the deployment.
- **Processors**: Hosting (e.g. Vercel), database provider, Resend (email), Upstash (Redis), Sentry, PostHog — subject to your DPA with each vendor.

## User rights (GDPR-style checklist)

Your product may need:

- **Access / export**: Mechanism to export a user’s data (admin tooling or manual DB export).
- **Erasure**: Delete user and dependent rows (respect FK cascades in Prisma schema).
- **Rectification**: Profile and settings in-app.
- **Object / restrict**: Depends on product decisions (e.g. marketing vs transactional mail).

Implement specifics in your deployment runbooks; the schema supports deleting users with cascades on many relations — verify all PII paths with `prisma/schema.prisma`.

## Data retention

Define retention for:

- Audit logs  
- Waitlist rows  
- OTP challenges (short-lived; deleted on use)  
- Application messages  

Document actual retention in your privacy policy.

## Subprocessors

List in your privacy policy: host, DB, email, Redis, error tracking, analytics.

## Breach response (outline)

1. Contain (revoke keys, block accounts if needed).  
2. Assess scope and legal notification deadlines.  
3. Notify users/regulators per counsel.  
4. Post-mortem and preventive measures.
