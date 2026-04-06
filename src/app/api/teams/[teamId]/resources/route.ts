import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember, assertTeamMeeting } from "@/lib/team-access";

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().max(2000).optional(),
  description: z.string().max(4000).optional(),
  meetingId: z.string().max(80).optional().nullable(),
});

export async function GET(
  request: Request,
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

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("meetingId")?.trim() || undefined;

  const resources = await prisma.teamResource.findMany({
    where: {
      teamId,
      ...(meetingId ? { meetingId } : {}),
    },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    resources: resources.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      description: r.description,
      meetingId: r.meetingId,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
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

  const parsed = resourceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const rawUrl = parsed.data.url?.trim() ?? "";
  let url: string | null = null;
  if (rawUrl) {
    try {
      new URL(rawUrl);
      url = rawUrl;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  }
  let meetingId: string | null = null;
  const rawMid = parsed.data.meetingId?.trim();
  if (rawMid) {
    const m = await assertTeamMeeting(teamId, rawMid);
    if (!m) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 400 });
    }
    meetingId = rawMid;
  }

  const row = await prisma.teamResource.create({
    data: {
      teamId,
      authorId: session.user.id,
      meetingId,
      title: parsed.data.title.trim(),
      url,
      description: parsed.data.description?.trim() || null,
    },
  });

  return NextResponse.json({ id: row.id, success: true });
}
