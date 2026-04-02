import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = (await request.json()) as { message?: string; active?: boolean };

  const data: { message?: string; active?: boolean } = {};
  if (typeof body.message === "string" && body.message.trim()) data.message = body.message.trim();
  if (typeof body.active === "boolean") data.active = body.active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const announcement = await prisma.siteAnnouncement.update({
    where: { id },
    data,
  });

  if (data.active === true) {
    await prisma.siteAnnouncement.updateMany({
      where: { id: { not: id } },
      data: { active: false },
    });
  }

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "announcement.update",
    targetType: "SiteAnnouncement",
    targetId: id,
    metadata: { message: data.message, active: data.active },
  });

  return NextResponse.json({ announcement });
}
