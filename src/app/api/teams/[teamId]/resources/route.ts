import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember } from "@/lib/team-access";

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().max(2000).optional(),
  description: z.string().max(4000).optional(),
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

  const resources = await prisma.teamResource.findMany({
    where: { teamId },
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
  const row = await prisma.teamResource.create({
    data: {
      teamId,
      authorId: session.user.id,
      title: parsed.data.title.trim(),
      url,
      description: parsed.data.description?.trim() || null,
    },
  });

  return NextResponse.json({ id: row.id, success: true });
}
