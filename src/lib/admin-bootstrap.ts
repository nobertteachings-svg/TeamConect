import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Comma-separated emails in ADMIN_BOOTSTRAP_EMAIL (case-insensitive).
 * Used to grant ADMIN on sign-in — see maybeGrantBootstrapAdmin.
 */
function parseBootstrapEmails(): string[] {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Grants ADMIN to bootstrap emails according to ADMIN_BOOTSTRAP_MODE:
 *
 * - `first` (default): only if there are zero ADMIN users in the DB (safe for production first deploy).
 * - `match`: grant whenever a listed email signs in and does not yet have ADMIN.
 *   In production, also set ADMIN_BOOTSTRAP_ALLOW_IN_PRODUCTION=1 or this mode does nothing.
 */
export async function maybeGrantBootstrapAdmin(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  const allowlist = parseBootstrapEmails();
  if (allowlist.length === 0 || !email) return;

  const normalized = email.trim().toLowerCase();
  if (!allowlist.includes(normalized)) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  if (!user || user.roles.includes(UserRole.ADMIN)) return;

  const modeRaw = process.env.ADMIN_BOOTSTRAP_MODE?.trim().toLowerCase() ?? "";
  const mode = modeRaw.length > 0 ? modeRaw : "first";
  const adminCount = await prisma.user.count({
    where: { roles: { has: UserRole.ADMIN } },
  });

  if (mode === "first") {
    if (adminCount > 0) return;
  } else if (mode === "match") {
    const prod = process.env.NODE_ENV === "production";
    const allowProd =
      process.env.ADMIN_BOOTSTRAP_ALLOW_IN_PRODUCTION === "1" ||
      process.env.ADMIN_BOOTSTRAP_ALLOW_IN_PRODUCTION === "true";
    if (prod && !allowProd) return;
  } else {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roles: [...user.roles, UserRole.ADMIN] },
  });

  console.info(
    `[teamconect/admin-bootstrap] Granted ADMIN to user ${userId} (${normalized}) mode=${mode}`
  );
}
