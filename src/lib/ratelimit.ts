import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { createMemorySlidingWindow } from "./memory-ratelimit";

const API_MAX = 60;
const API_WINDOW_MS = 60_000;
const AUTH_MAX = 10;
const AUTH_WINDOW_MS = 60 * 60_000;
const WAITLIST_MAX = 5;
const WAITLIST_WINDOW_MS = 60 * 60_000;

const memoryApi = createMemorySlidingWindow(API_MAX, API_WINDOW_MS);
const memoryAuth = createMemorySlidingWindow(AUTH_MAX, AUTH_WINDOW_MS);
const memoryWaitlist = createMemorySlidingWindow(WAITLIST_MAX, WAITLIST_WINDOW_MS);

const apiRedis =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(API_MAX, "1 m"),
    prefix: "teamconnect:rl:api",
  });

const authRedis =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(AUTH_MAX, "1 h"),
    prefix: "teamconnect:rl:auth",
  });

const waitlistRedis =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(WAITLIST_MAX, "1 h"),
    prefix: "teamconnect:rl:waitlist",
  });

export async function limitApi(identifier: string): Promise<{
  success: boolean;
  remaining: number;
}> {
  if (apiRedis) {
    const r = await apiRedis.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryApi.limit(identifier);
}

export async function limitAuth(identifier: string): Promise<{
  success: boolean;
  remaining: number;
}> {
  if (authRedis) {
    const r = await authRedis.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryAuth.limit(identifier);
}

export async function limitWaitlist(identifier: string): Promise<{
  success: boolean;
  remaining: number;
}> {
  if (waitlistRedis) {
    const r = await waitlistRedis.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return memoryWaitlist.limit(identifier);
}
