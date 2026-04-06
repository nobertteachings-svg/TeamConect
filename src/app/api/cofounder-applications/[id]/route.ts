import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { syncTeamOnApplicationStatusChange } from "@/lib/team-sync";
import { getCoFounderSlotSnapshot } from "@/lib/team-slots";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();
  if (!["pending", "accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const app = await prisma.coFounderApplication.findFirst({
    where: { id },
    include: { idea: { include: { founder: true } } },
  });

  if (!app || app.idea.founder.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const previousStatus = app.status;
  const founderUserId = app.idea.founder.userId;

  if (status === "accepted" && previousStatus !== "accepted") {
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
        { error: "The team is full. Increase co-founder slots or reject an accepted member first." },
        { status: 400 }
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.coFounderApplication.update({
      where: { id },
      data: { status },
    });
    await syncTeamOnApplicationStatusChange(tx, {
      ideaId: app.ideaId,
      applicantUserId: app.userId,
      founderUserId,
      previousStatus,
      newStatus: status,
    });
    const team = await tx.startupTeam.findUnique({
      where: { ideaId: app.ideaId },
      select: { id: true },
    });
    return team;
  });

  return NextResponse.json({ success: true, teamId: result?.id ?? null });
}
