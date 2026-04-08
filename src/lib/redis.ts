import { Redis } from "@upstash/redis";

/**
 * Upstash Redis - serverless-friendly, works on Vercel/Edge
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const CACHE_TTL = {
  events: 300,
  ideas: 60,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<string>(key);
    return data as T | null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: string | object,
  ttlSeconds?: number
): Promise<void> {
  if (!redis) return;
  try {
    const val = typeof value === "string" ? value : JSON.stringify(value);
    await redis.set(key, val, { ex: ttlSeconds ?? 60 });
  } catch {
    // Fail silently
  }
}

export function cacheKey(
  prefix: keyof typeof CACHE_TTL,
  params: Record<string, string | number>
): string {
  const parts = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `teamconect:${prefix}:${parts.join(":")}`;
}

export function getCacheTtl(prefix: keyof typeof CACHE_TTL): number {
  return CACHE_TTL[prefix] ?? 60;
}

/** Same key as `cacheKey("events", {})` — delete after event mutations. */
export function publicEventsCacheKey(): string {
  return cacheKey("events", {});
}

export async function invalidatePublicEventsCache(): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(publicEventsCacheKey());
  } catch {
    /* ignore */
  }
}
