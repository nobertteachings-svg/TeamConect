import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const announcements = await prisma.siteAnnouncement.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const body = (await request.json()) as { message?: string; active?: boolean };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const announcement = await prisma.siteAnnouncement.create({
    data: {
      message,
      active: body.active === true,
    },
  });

  if (body.active === true) {
    await prisma.siteAnnouncement.updateMany({
      where: { id: { not: announcement.id } },
      data: { active: false },
    });
  }

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "announcement.create",
    targetType: "SiteAnnouncement",
    targetId: announcement.id,
    metadata: { active: announcement.active },
  });

  return NextResponse.json({ announcement });
}
