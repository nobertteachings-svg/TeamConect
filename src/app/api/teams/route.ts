import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          idea: { select: { id: true, title: true, slug: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { team: { updatedAt: "desc" } },
  });

  const teams = memberships.map((m) => ({
    teamId: m.team.id,
    role: m.role,
    idea: m.team.idea,
    memberCount: m.team._count.members,
    updatedAt: m.team.updatedAt.toISOString(),
  }));

  return NextResponse.json({ teams });
}
