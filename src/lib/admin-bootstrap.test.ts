import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserRole } from "@prisma/client";

const mockFindUnique = vi.fn();
const mockCount = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      count: (...args: unknown[]) => mockCount(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

describe("maybeGrantBootstrapAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ADMIN_BOOTSTRAP_EMAIL = "admin@example.com";
    delete process.env.ADMIN_BOOTSTRAP_MODE;
    delete process.env.ADMIN_BOOTSTRAP_ALLOW_IN_PRODUCTION;
    mockFindUnique.mockReset();
    mockCount.mockReset();
    mockUpdate.mockReset();
  });

  afterEach(() => {
    delete process.env.ADMIN_BOOTSTRAP_EMAIL;
    delete process.env.ADMIN_BOOTSTRAP_MODE;
  });

  it("grants ADMIN in first mode when no admins exist", async () => {
    mockFindUnique.mockResolvedValue({ roles: [UserRole.FOUNDER] });
    mockCount.mockResolvedValue(0);
    mockUpdate.mockResolvedValue({});

    const { maybeGrantBootstrapAdmin } = await import("./admin-bootstrap");
    await maybeGrantBootstrapAdmin("user-1", "admin@example.com");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { roles: [UserRole.FOUNDER, UserRole.ADMIN] },
    });
  });

  it("does not grant in first mode when an admin already exists", async () => {
    mockFindUnique.mockResolvedValue({ roles: [UserRole.FOUNDER] });
    mockCount.mockResolvedValue(1);

    const { maybeGrantBootstrapAdmin } = await import("./admin-bootstrap");
    await maybeGrantBootstrapAdmin("user-1", "admin@example.com");

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("skips when email not in allowlist", async () => {
    const { maybeGrantBootstrapAdmin } = await import("./admin-bootstrap");
    await maybeGrantBootstrapAdmin("user-1", "other@example.com");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
