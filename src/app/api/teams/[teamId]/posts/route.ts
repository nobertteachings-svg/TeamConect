import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember } from "@/lib/team-access";
import { canAddReply } from "@/lib/team-post-depth";

const postSchema = z.object({
  body: z.string().min(1).max(12_000),
  parentId: z.string().min(1).max(40).optional().nullable(),
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

  const posts = await prisma.teamPost.findMany({
    where: { teamId },
    include: { author: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      body: p.body,
      parentId: p.parentId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      author: p.author,
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

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const parentId = parsed.data.parentId?.trim() || null;
  if (parentId) {
    const parent = await prisma.teamPost.findFirst({
      where: { id: parentId, teamId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Invalid thread" }, { status: 400 });
    }
    const ok = await canAddReply(prisma, parentId);
    if (!ok) {
      return NextResponse.json({ error: "Thread too deep" }, { status: 400 });
    }
  }

  const post = await prisma.teamPost.create({
    data: {
      teamId,
      authorId: session.user.id,
      parentId,
      body: parsed.data.body.trim(),
    },
  });

  return NextResponse.json({ id: post.id, success: true });
}
