import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { assertTeamMember } from "@/lib/team-access";

const patchSchema = z.object({
  body: z.string().min(1).max(12_000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string; postId: string }> }
) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, postId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const post = await prisma.teamPost.findFirst({
    where: { id: postId, teamId },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await prisma.teamPost.update({
    where: { id: postId },
    data: { body: parsed.data.body.trim() },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string; postId: string }> }
) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, postId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const post = await prisma.teamPost.findFirst({
    where: { id: postId, teamId },
  });
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAuthor = post.authorId === session.user.id;
  const isFounder = membership.role === "FOUNDER";
  if (!isAuthor && !isFounder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teamPost.delete({ where: { id: postId } });

  return NextResponse.json({ success: true });
}
