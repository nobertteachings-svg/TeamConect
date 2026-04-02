import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateProductionServerEnv } from "./env-server";

describe("validateProductionServerEnv", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops when not production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXTAUTH_SECRET", "");
    expect(() => validateProductionServerEnv()).not.toThrow();
  });

  it("throws when production and DATABASE_URL missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_SECRET", "x".repeat(32));
    vi.stubEnv("DATABASE_URL", "");
    expect(() => validateProductionServerEnv()).toThrow(/DATABASE_URL/);
  });

  it("throws when NEXTAUTH_SECRET too short", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/x");
    vi.stubEnv("NEXTAUTH_SECRET", "short");
    expect(() => validateProductionServerEnv()).toThrow(/NEXTAUTH_SECRET/);
  });

  it("passes with DATABASE_URL and long NEXTAUTH_SECRET", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/x");
    vi.stubEnv("NEXTAUTH_SECRET", "x".repeat(32));
    vi.stubEnv("REQUIRE_UPSTASH_IN_PRODUCTION", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => validateProductionServerEnv()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws when REQUIRE_UPSTASH_IN_PRODUCTION is set but Redis env is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/x");
    vi.stubEnv("NEXTAUTH_SECRET", "x".repeat(32));
    vi.stubEnv("REQUIRE_UPSTASH_IN_PRODUCTION", "1");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    expect(() => validateProductionServerEnv()).toThrow(/UPSTASH/);
  });
});
