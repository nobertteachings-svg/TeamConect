import type { Prisma } from "@prisma/client";

const WELCOME_POST =
  "Welcome to your team workspace. Use this thread to coordinate, share links, and plan meetings together.";

/**
 * When a co-founder application is accepted: ensure a StartupTeam exists and add members.
 * When moving from accepted → rejected: remove that applicant from the team (not the founder).
 */
export async function syncTeamOnApplicationStatusChange(
  tx: Prisma.TransactionClient,
  params: {
    ideaId: string;
    applicantUserId: string;
    founderUserId: string;
    previousStatus: string;
    newStatus: string;
  }
): Promise<void> {
  const { ideaId, applicantUserId, founderUserId, previousStatus, newStatus } = params;

  if (newStatus === "accepted") {
    let team = await tx.startupTeam.findUnique({ where: { ideaId } });
    if (!team) {
      team = await tx.startupTeam.create({
        data: {
          ideaId,
          members: {
            create: [
              { userId: founderUserId, role: "FOUNDER" },
              { userId: applicantUserId, role: "MEMBER" },
            ],
          },
        },
      });
      await tx.teamPost.create({
        data: {
          teamId: team.id,
          authorId: founderUserId,
          body: WELCOME_POST,
        },
      });
    } else {
      await tx.teamMember.upsert({
        where: {
          teamId_userId: { teamId: team.id, userId: applicantUserId },
        },
        create: { teamId: team.id, userId: applicantUserId, role: "MEMBER" },
        update: {},
      });
    }
  }

  if (newStatus === "rejected" && previousStatus === "accepted") {
    const team = await tx.startupTeam.findUnique({ where: { ideaId } });
    if (team) {
      await tx.teamMember.deleteMany({
        where: {
          teamId: team.id,
          userId: applicantUserId,
          role: "MEMBER",
        },
      });
    }
  }
}
