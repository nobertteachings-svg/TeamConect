import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";

const STATUSES = new Set(["pending", "accepted", "rejected"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    adminNote?: string | null;
    reason?: string;
  };

  const existing = await prisma.coFounderApplication.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const data: { status?: string; adminNote?: string | null } = {};
  if (body.status !== undefined) {
    const s = String(body.status).toLowerCase();
    if (!STATUSES.has(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = s;
  }
  if (body.adminNote !== undefined) {
    data.adminNote = body.adminNote === null || body.adminNote === "" ? null : String(body.adminNote);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const updated = await prisma.coFounderApplication.update({
    where: { id },
    data,
    select: {
      id: true,
      status: true,
      adminNote: true,
      idea: { select: { id: true, title: true } },
      user: { select: { id: true, email: true } },
    },
  });

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "application.update",
    targetType: "CoFounderApplication",
    targetId: id,
    metadata: { status: data.status ?? null, adminNote: data.adminNote ?? null },
    reason: body.reason?.trim() || null,
  });

  return NextResponse.json({ application: updated });
}
