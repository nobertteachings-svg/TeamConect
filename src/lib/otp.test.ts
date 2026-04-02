import { describe, it, expect } from "vitest";
import { hashOtpCode, verifyOtpCode, generateNumericOtp } from "./otp";

describe("otp", () => {
  it("verify accepts correct code", () => {
    const hash = hashOtpCode("123456");
    expect(verifyOtpCode("123456", hash)).toBe(true);
  });

  it("verify rejects wrong code", () => {
    const hash = hashOtpCode("123456");
    expect(verifyOtpCode("000000", hash)).toBe(false);
  });

  it("generateNumericOtp returns fixed length digits", () => {
    const code = generateNumericOtp(6);
    expect(code).toMatch(/^\d{6}$/);
  });
});
