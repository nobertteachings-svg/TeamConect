import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { assertTeamMember } from "@/lib/team-access";
import { TeamWorkspace } from "@/components/team/team-workspace";

export default async function TeamWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string; teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const membership = await assertTeamMember(teamId, session.id);
  if (!membership) notFound();

  const team = await prisma.startupTeam.findUnique({
    where: { id: teamId },
    include: {
      idea: { select: { title: true, slug: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, country: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!team) notFound();

  const [posts, resources, meetings] = await Promise.all([
    prisma.teamPost.findMany({
      where: { teamId },
      include: { author: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.teamResource.findMany({
      where: { teamId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.teamMeeting.findMany({
      where: { teamId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  return (
    <TeamWorkspace
      teamId={team.id}
      idea={team.idea}
      members={team.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      }))}
      initialPosts={posts.map((p) => ({
        id: p.id,
        body: p.body,
        parentId: p.parentId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        author: p.author,
      }))}
      currentUserRole={membership.role}
      initialResources={resources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        description: r.description,
        meetingId: r.meetingId,
        createdAt: r.createdAt.toISOString(),
        author: r.author,
      }))}
      initialMeetings={meetings.map((m) => ({
        id: m.id,
        title: m.title,
        startsAt: m.startsAt?.toISOString() ?? null,
        meetingUrl: m.meetingUrl,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
        author: m.author,
      }))}
      currentUserId={session.id}
    />
  );
}
