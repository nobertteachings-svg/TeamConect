/**
 * Production checks for server startup (see instrumentation.ts).
 * Keeps deploys from running with a broken core config.
 */

const MIN_NEXTAUTH_SECRET_LEN = 32;

export function validateProductionServerEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    missing.push("DATABASE_URL");
  }

  const secret = process.env.NEXTAUTH_SECRET?.trim() ?? "";
  if (secret.length < MIN_NEXTAUTH_SECRET_LEN) {
    missing.push(
      `NEXTAUTH_SECRET (at least ${MIN_NEXTAUTH_SECRET_LEN} characters)`
    );
  }

  if (missing.length > 0) {
    const msg = `Production misconfiguration: ${missing.join(", ")}`;
    console.error(`[teamconect/env] ${msg}`);
    throw new Error(msg);
  }

  const redisConfigured =
    Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

  const requireRedis =
    process.env.REQUIRE_UPSTASH_IN_PRODUCTION === "true" ||
    process.env.REQUIRE_UPSTASH_IN_PRODUCTION === "1";

  if (requireRedis && !redisConfigured) {
    const msg =
      "Production misconfiguration: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN when REQUIRE_UPSTASH_IN_PRODUCTION=1";
    console.error(`[teamconect/env] ${msg}`);
    throw new Error(msg);
  }

  if (!process.env.NEXTAUTH_URL?.trim()) {
    console.warn(
      "[teamconect/env] NEXTAUTH_URL is unset — set it to your canonical site URL in production."
    );
  }

  const hasSmtp =
    Boolean(process.env.SMTP_URL?.trim()) ||
    (Boolean(process.env.GMAIL_USER?.trim()) && Boolean(process.env.GMAIL_APP_PASSWORD?.trim())) ||
    (Boolean(process.env.SMTP_HOST?.trim()) &&
      Boolean(process.env.SMTP_USER?.trim()) &&
      Boolean(process.env.SMTP_PASS?.trim()));

  if (!hasSmtp && !process.env.RESEND_API_KEY?.trim()) {
    console.warn(
      "[teamconect/env] No mail provider: set GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_* / SMTP_URL), or RESEND_API_KEY — otherwise email OTP and transactional mail will not send."
    );
  }

  if (!redisConfigured) {
    console.warn(
      "[teamconect/env] Upstash Redis unset — API rate limits use in-memory counters per server instance only; enable UPSTASH_* for consistent limits, or set REQUIRE_UPSTASH_IN_PRODUCTION=1 to enforce Redis."
    );
  }
}
