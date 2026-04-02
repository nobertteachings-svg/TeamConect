import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMemorySlidingWindow } from "./memory-ratelimit";

describe("createMemorySlidingWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to maxHits within the window", async () => {
    const limiter = createMemorySlidingWindow(3, 60_000);
    expect((await limiter.limit("ip1")).success).toBe(true);
    expect((await limiter.limit("ip1")).success).toBe(true);
    expect((await limiter.limit("ip1")).success).toBe(true);
    expect((await limiter.limit("ip1")).success).toBe(false);
  });

  it("tracks keys independently", async () => {
    const limiter = createMemorySlidingWindow(1, 60_000);
    expect((await limiter.limit("a")).success).toBe(true);
    expect((await limiter.limit("b")).success).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const limiter = createMemorySlidingWindow(2, 60_000);
    expect((await limiter.limit("x")).success).toBe(true);
    expect((await limiter.limit("x")).success).toBe(true);
    expect((await limiter.limit("x")).success).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect((await limiter.limit("x")).success).toBe(true);
  });
});
