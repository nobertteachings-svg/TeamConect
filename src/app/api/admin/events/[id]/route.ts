import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { invalidatePublicEventsCache } from "@/lib/redis";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const admin = await prisma.user.findUnique({ where: { id: session?.user?.id } });
  if (!admin?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await prisma.event.deleteMany({ where: { id } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await invalidatePublicEventsCache();

  return NextResponse.json({ success: true });
}
