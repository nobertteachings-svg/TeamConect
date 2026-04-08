import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";
import { notifyApplicationStatusOutcomes } from "@/lib/cofounder-application-notify";
import { syncTeamOnApplicationStatusChange } from "@/lib/team-sync";
import { getCoFounderSlotSnapshot } from "@/lib/team-slots";

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

  const app = await prisma.coFounderApplication.findUnique({
    where: { id },
    include: {
      idea: { include: { founder: true } },
    },
  });

  if (!app) {
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

  const previousStatus = app.status;
  const founderUserId = app.idea.founder.userId;
  const statusChanging =
    data.status !== undefined && data.status !== app.status;

  const updatePayload: Prisma.CoFounderApplicationUpdateInput = {};
  if (data.adminNote !== undefined) updatePayload.adminNote = data.adminNote;
  if (data.status !== undefined) updatePayload.status = data.status;

  let teamIdOut: string | null = null;

  if (statusChanging && data.status !== undefined) {
    const newStatus = data.status;

    if (newStatus === "accepted" && previousStatus !== "accepted") {
      const snap = await getCoFounderSlotSnapshot(prisma, app.ideaId);
      if (!snap) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const alreadyMember = await prisma.teamMember.findFirst({
        where: {
          role: "MEMBER",
          userId: app.userId,
          team: { ideaId: app.ideaId },
        },
        select: { id: true },
      });
      if (!alreadyMember && snap.remaining < 1) {
        return NextResponse.json(
          {
            error:
              "The team is full. Increase co-founder slots on the idea or reject an accepted member first.",
          },
          { status: 400 }
        );
      }
    }

    const team = await prisma.$transaction(async (tx) => {
      await tx.coFounderApplication.update({
        where: { id },
        data: updatePayload,
      });
      await syncTeamOnApplicationStatusChange(tx, {
        ideaId: app.ideaId,
        applicantUserId: app.userId,
        founderUserId,
        previousStatus,
        newStatus,
      });
      const t = await tx.startupTeam.findUnique({
        where: { ideaId: app.ideaId },
        select: { id: true },
      });
      return t;
    });
    teamIdOut = team?.id ?? null;

    void notifyApplicationStatusOutcomes({
      previousStatus,
      newStatus,
      applicantUserId: app.userId,
      idea: { slug: app.idea.slug, title: app.idea.title },
      teamId: teamIdOut,
    });
  } else if (Object.keys(updatePayload).length > 0) {
    await prisma.coFounderApplication.update({
      where: { id },
      data: updatePayload,
    });
  }

  const updated = await prisma.coFounderApplication.findUnique({
    where: { id },
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

  return NextResponse.json({ application: updated, teamId: teamIdOut });
}
