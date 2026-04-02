import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth-config", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "./require-admin";

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("returns 401 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const r = await requireAdmin();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response).toBeInstanceOf(NextResponse);
      expect(r.response.status).toBe(401);
    }
  });

  it("returns 403 when user is not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "a@b.c",
      roles: ["USER"],
    } as never);

    const r = await requireAdmin();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("returns admin when user has ADMIN role", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "u1" } } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "admin@b.c",
      roles: ["USER", "ADMIN"],
    } as never);

    const r = await requireAdmin();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.adminUser.id).toBe("u1");
      expect(r.adminUser.email).toBe("admin@b.c");
    }
  });
});
