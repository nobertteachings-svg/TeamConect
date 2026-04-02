/**
 * In-process sliding-window limiter. Use Upstash in production when running
 * multiple instances — each process has its own counters here.
 */
export function createMemorySlidingWindow(maxHits: number, windowMs: number) {
  const store = new Map<string, number[]>();

  return {
    async limit(identifier: string): Promise<{ success: boolean; remaining: number }> {
      const now = Date.now();
      const cutoff = now - windowMs;
      let hits = store.get(identifier) ?? [];
      hits = hits.filter((t) => t > cutoff);
      if (hits.length >= maxHits) {
        store.set(identifier, hits);
        return { success: false, remaining: 0 };
      }
      hits.push(now);
      store.set(identifier, hits);
      return { success: true, remaining: maxHits - hits.length };
    },
  };
}
