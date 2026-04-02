import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { getServerSession } from "next-auth";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

describe.skipIf(!!process.env.VITEST_SKIP_DB_INTEGRATION)(
  "POST /api/startup-ideas (Prisma + handler)",
  () => {
    let prisma: import("@prisma/client").PrismaClient;
    let POST: (req: Request) => Promise<Response>;
    let userId: string;

    beforeAll(async () => {
      const m = await import("@/lib/prisma");
      prisma = m.prisma;
      const route = await import("./route");
      POST = route.POST;
    });

    beforeEach(async () => {
      const email = `int-idea-${Date.now()}-${Math.random().toString(36).slice(2)}@test.invalid`;
      const user = await prisma.user.create({
        data: {
          email,
          country: "US",
          name: "Integration Founder",
        },
      });
      userId = user.id;
      await prisma.founderProfile.create({
        data: {
          userId: user.id,
          skills: [],
          industries: [],
          languages: [],
        },
      });
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: user.id },
      } as never);
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: { endsWith: "@test.invalid" } },
      });
    });

    it("creates a public startup idea for the session user", async () => {
      const founder = await prisma.founderProfile.findUniqueOrThrow({
        where: { userId },
      });

      const title = `Integration Idea ${Date.now()}`;
      const res = await POST(
        new Request("http://localhost/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: "Integration test description body.",
            rolesNeeded: ["Engineer"],
            industries: ["Software"],
            founderId: founder.id,
            protectionMode: "FULL_PUBLIC",
          }),
        })
      );

      expect(res.status).toBe(200);
      const idea = await prisma.startupIdea.findFirst({
        where: { founderId: founder.id, title },
      });
      expect(idea).not.toBeNull();
      expect(idea?.slug.length).toBeGreaterThan(0);
    });
  }
);
