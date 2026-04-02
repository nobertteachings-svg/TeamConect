import { vi } from "vitest";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  process.env.VITEST_SKIP_DB_INTEGRATION = "1";
}

process.env.NODE_ENV = "test";
if (!process.env.NEXTAUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET.length < 32) {
  process.env.NEXTAUTH_SECRET = "integration-test-nextauth-secret-32+chars";
}

vi.mock("@/lib/mail", () => ({
  sendSignInOtpEmail: vi.fn().mockResolvedValue(undefined),
  sendWaitlistConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendNewCoFounderApplicationEmail: vi.fn().mockResolvedValue(undefined),
}));
