import { describe, it, expect, beforeAll } from "vitest";

describe.skipIf(!!process.env.VITEST_SKIP_DB_INTEGRATION)(
  "POST /api/auth/email-otp/request (Prisma + handler)",
  () => {
    let prisma: import("@prisma/client").PrismaClient;
    let POST: (req: Request) => Promise<Response>;

    beforeAll(async () => {
      const m = await import("@/lib/prisma");
      prisma = m.prisma;
      const route = await import("./route");
      POST = route.POST;
    });

    it("persists EmailOtpChallenge for valid email and country", async () => {
      const email = `int-otp-${Date.now()}-${Math.random().toString(36).slice(2)}@test.invalid`;
      const res = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, country: "US" }),
        })
      );
      expect(res.status).toBe(200);

      const row = await prisma.emailOtpChallenge.findFirst({ where: { email } });
      expect(row).not.toBeNull();
      expect(row?.country).toBe("US");

      await prisma.emailOtpChallenge.deleteMany({ where: { email } });
    });

    it("returns 400 for invalid ISO2 country", async () => {
      const res = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `int-bad-${Date.now()}@test.invalid`,
            country: "ZZ",
          }),
        })
      );
      expect(res.status).toBe(400);
    });
  }
);
