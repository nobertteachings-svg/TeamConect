import { describe, it, expect } from "vitest";
import { getRateLimitIdentifier } from "./rate-limit";

describe("getRateLimitIdentifier", () => {
  it("prefers cf-connecting-ip", () => {
    const req = new Request("https://x", {
      headers: {
        "cf-connecting-ip": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      },
    });
    expect(getRateLimitIdentifier(req)).toBe("1.1.1.1");
  });

  it("falls back to x-forwarded-for first hop", () => {
    const req = new Request("https://x", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
    });
    expect(getRateLimitIdentifier(req)).toBe("9.9.9.9");
  });

  it("uses anonymous when no headers", () => {
    const req = new Request("https://x");
    expect(getRateLimitIdentifier(req)).toBe("anonymous");
  });
});
