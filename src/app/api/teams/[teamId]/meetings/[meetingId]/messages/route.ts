import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember, assertTeamMeeting } from "@/lib/team-access";

const bodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, meetingId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meeting = await assertTeamMeeting(teamId, meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await prisma.teamMeetingMessage.findMany({
    where: { meetingId },
    include: { author: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, meetingId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meeting = await assertTeamMeeting(teamId, meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const row = await prisma.teamMeetingMessage.create({
    data: {
      meetingId,
      authorId: session.user.id,
      body: parsed.data.body.trim(),
    },
  });

  return NextResponse.json({ id: row.id, success: true });
}
