import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember } from "@/lib/team-access";

const meetingSchema = z.object({
  title: z.string().min(1).max(200),
  startsAt: z.string().max(80).optional().nullable(),
  meetingUrl: z.string().max(2000).optional(),
  notes: z.string().max(8000).optional(),
});

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

  const meetings = await prisma.teamMeeting.findMany({
    where: { teamId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      id: m.id,
      title: m.title,
      startsAt: m.startsAt?.toISOString() ?? null,
      meetingUrl: m.meetingUrl,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      author: m.author,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = meetingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  let startsAt: Date | null = null;
  if (parsed.data.startsAt?.trim()) {
    const d = new Date(parsed.data.startsAt.trim());
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    startsAt = d;
  }
  const rawMeetUrl = parsed.data.meetingUrl?.trim() ?? "";
  let meetingUrl: string | null = null;
  if (rawMeetUrl) {
    try {
      new URL(rawMeetUrl);
      meetingUrl = rawMeetUrl;
    } catch {
      return NextResponse.json({ error: "Invalid meeting URL" }, { status: 400 });
    }
  }

  const row = await prisma.teamMeeting.create({
    data: {
      teamId,
      authorId: session.user.id,
      title: parsed.data.title.trim(),
      startsAt,
      meetingUrl,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  return NextResponse.json({ id: row.id, success: true });
}
