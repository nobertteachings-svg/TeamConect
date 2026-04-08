import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 25));
  const unreadOnly = searchParams.get("unread") === "1";

  const where = {
    userId: session.user.id,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function PATCH(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { markAll?: boolean; readIds?: string[] };
  try {
    body = (await request.json()) as { markAll?: boolean; readIds?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const now = new Date();
  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(body.readIds) && body.readIds.length > 0) {
    const ids = body.readIds.filter((id) => typeof id === "string" && id.length > 0).slice(0, 100);
    await prisma.notification.updateMany({
      where: { userId: session.user.id, id: { in: ids } },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "markAll or readIds required" }, { status: 400 });
}
