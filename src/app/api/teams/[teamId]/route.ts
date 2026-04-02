import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { assertTeamMember } from "@/lib/team-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const team = await prisma.startupTeam.findUnique({
    where: { id: teamId },
    include: {
      idea: { select: { id: true, title: true, slug: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true, country: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    team: {
      id: team.id,
      idea: team.idea,
      members: team.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
      yourRole: membership.role,
    },
  });
}
