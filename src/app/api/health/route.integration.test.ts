import { describe, it, expect, beforeAll } from "vitest";

describe.skipIf(!!process.env.VITEST_SKIP_DB_INTEGRATION)(
  "GET /api/health (Prisma)",
  () => {
    let GET: () => Promise<Response>;

    beforeAll(async () => {
      const route = await import("./route");
      GET = route.GET;
    });

    it("returns 200 and database true when Postgres is reachable", async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; database: boolean };
      expect(body.database).toBe(true);
      expect(body.status).toBe("healthy");
    });
  }
);
