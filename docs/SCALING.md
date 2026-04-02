# Scaling & Traffic Readiness

TeamConnect is configured for global traffic with the following infrastructure.

## Implemented

### 1. Redis caching (Upstash)
- **Files:** `src/lib/redis.ts`, `src/lib/cached-data.ts`
- Community events and startup ideas lists can be cached in Redis
- TTLs: ideas 60s, events 5min
- First page of each list is cached; cursor pages bypass cache
- **Env:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### 2. Rate limiting (Upstash + in-memory fallback)
- **Files:** `src/lib/ratelimit.ts`, `src/lib/rate-limit.ts`, `src/lib/memory-ratelimit.ts`
- **API:** 60 requests/min per IP — applied to founder profile, user country, startup idea create, co-founder apply/update
- **Auth (OTP request):** 10 requests/hour per IP (in addition to per-email DB caps)
- **Waitlist:** 5 signups/hour per IP
- **Without Redis:** limits use an in-process sliding window (fine for single-instance / local dev). With multiple app instances, set `UPSTASH_REDIS_*` so counters are shared. Optionally set `REQUIRE_UPSTASH_IN_PRODUCTION=1` to **fail startup** in production if Redis is missing (`src/lib/env-server.ts`).

### 3. Cache-Control & CDN
- **File:** `next.config.mjs`
- `/teamconnect-mark.svg` and `/_next/static/*` cached immutable (1 year)
- Image formats: AVIF, WebP
- Compatible with Cloudflare and other CDNs

### 4. Cursor-based pagination
- **Files:** `src/lib/cached-data.ts`, co-founders listing page
- 20 items per page with "Load more" links for startup ideas
- Cursor-based (no offset) for stable performance

### 5. Database connection pooling
- **File:** `.env.example`
- Use a pooled connection string (Neon pooler, Supabase Transaction pooler, PgBouncer)
- Add `?connection_limit=5` for serverless to avoid exhausting connections

### 6. PWA
- **File:** `public/manifest.json`
- Web app manifest for "Add to Home Screen"
- Theme and icons configured

### 7. Monitoring

#### Sentry (errors)
- Error tracking when DSN is set

#### PostHog (analytics)
- Analytics when key is set

## Recommendations

1. **Cloudflare** – Put the app behind Cloudflare
2. **Read replicas** – For high read volume if needed
3. **Service worker** – Optional offline support
