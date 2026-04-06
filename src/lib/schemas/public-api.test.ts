import { describe, it, expect } from "vitest";
import {
  emailOtpRequestBodySchema,
  cofounderApplicationBodySchema,
  startupIdeaPostBodySchema,
} from "./public-api";

describe("emailOtpRequestBodySchema", () => {
  it("accepts valid email and ISO2 country", () => {
    const r = emailOtpRequestBodySchema.safeParse({
      email: "User@Example.com",
      country: "US",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = emailOtpRequestBodySchema.safeParse({ email: "nope", country: "US" });
    expect(r.success).toBe(false);
  });

  it("rejects country not length 2", () => {
    const r = emailOtpRequestBodySchema.safeParse({
      email: "a@b.co",
      country: "USA",
    });
    expect(r.success).toBe(false);
  });
});

describe("cofounderApplicationBodySchema", () => {
  const valid = {
    ideaId: "cuid123",
    message: "x".repeat(50),
    commitmentKey: "10-20" as const,
  };

  it("accepts minimum message length", () => {
    expect(cofounderApplicationBodySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short message", () => {
    const r = cofounderApplicationBodySchema.safeParse({
      ...valid,
      message: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid commitment key", () => {
    const r = cofounderApplicationBodySchema.safeParse({
      ...valid,
      commitmentKey: "full-time",
    });
    expect(r.success).toBe(false);
  });
});

describe("startupIdeaPostBodySchema", () => {
  const base = {
    title: "T",
    description: "D",
    rolesNeeded: ["Engineer"],
    industries: ["Tech"],
    founderId: "fp1",
  };

  it("accepts FULL_PUBLIC without teaser", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "FULL_PUBLIC",
    });
    expect(r.success).toBe(true);
  });

  it("rejects TEASER_ONLY without 20+ char teaser", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "TEASER_ONLY",
      publicTeaser: "too short",
    });
    expect(r.success).toBe(false);
  });

  it("accepts TEASER_ONLY with long teaser", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "TEASER_ONLY",
      publicTeaser: "a".repeat(20),
    });
    expect(r.success).toBe(true);
  });

  it("defaults coFounderSlotsWanted to 1", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "FULL_PUBLIC",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.coFounderSlotsWanted).toBe(1);
  });

  it("accepts coFounderSlotsWanted in range", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "FULL_PUBLIC",
      coFounderSlotsWanted: 5,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.coFounderSlotsWanted).toBe(5);
  });

  it("rejects coFounderSlotsWanted out of range", () => {
    const r = startupIdeaPostBodySchema.safeParse({
      ...base,
      protectionMode: "FULL_PUBLIC",
      coFounderSlotsWanted: 0,
    });
    expect(r.success).toBe(false);
  });
});
