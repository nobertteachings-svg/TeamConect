import type { Prisma, PrismaClient } from "@prisma/client";

type Db = Prisma.TransactionClient | PrismaClient;

export async function getCoFounderSlotSnapshot(db: Db, ideaId: string) {
  const idea = await db.startupIdea.findUnique({
    where: { id: ideaId },
    select: { coFounderSlotsWanted: true, status: true },
  });
  if (!idea) return null;

  const team = await db.startupTeam.findUnique({
    where: { ideaId },
    select: { id: true },
  });
  let filled = 0;
  if (team) {
    filled = await db.teamMember.count({
      where: { teamId: team.id, role: "MEMBER" },
    });
  }

  const remaining = Math.max(0, idea.coFounderSlotsWanted - filled);
  return {
    slotsWanted: idea.coFounderSlotsWanted,
    filled,
    remaining,
    status: idea.status,
  };
}
