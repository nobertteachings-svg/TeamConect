import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";

export async function requireAdmin(): Promise<
  | { ok: true; adminUser: { id: string; email: string | null } }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, roles: true },
  });
  if (!user?.roles.includes("ADMIN")) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, adminUser: { id: user.id, email: user.email } };
}
