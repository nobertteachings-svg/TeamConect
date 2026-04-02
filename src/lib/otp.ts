import { createHmac, randomInt, timingSafeEqual } from "crypto";

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? "dev-otp-secret-change-me";
}

export function hashOtpCode(code: string): string {
  return createHmac("sha256", secret()).update(code).digest("hex");
}

export function verifyOtpCode(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtpCode(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateNumericOtp(length = 6): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}
