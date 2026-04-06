import { prisma } from "@/lib/prisma";

export async function getTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findFirst({
    where: { teamId, userId },
    include: {
      team: {
        include: {
          idea: {
            select: {
              id: true,
              title: true,
              slug: true,
              founder: { select: { userId: true } },
            },
          },
        },
      },
    },
  });
}

export async function assertTeamMember(teamId: string, userId: string) {
  const m = await getTeamMembership(teamId, userId);
  return m;
}

export async function assertTeamMeeting(teamId: string, meetingId: string) {
  return prisma.teamMeeting.findFirst({
    where: { id: meetingId, teamId },
  });
}
