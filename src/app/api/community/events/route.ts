import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { invalidatePublicEventsCache } from "@/lib/redis";
import { generateSlug } from "@/lib/utils";

const postSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  type: z.string().min(2).max(60),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  meetingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isVirtual: z.boolean().optional(),
  timezone: z.string().max(80).optional().nullable(),
  language: z.string().max(20).optional().nullable(),
});

export async function POST(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, accountDisabled: true },
  });
  if (!user || user.accountDisabled) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (endAt.getTime() <= startAt.getTime()) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }
  if (startAt.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: "Start time must be in the future" }, { status: 400 });
  }

  const slugs = (await prisma.event.findMany({ select: { slug: true } })).map((e) => e.slug);
  const slug = generateSlug(`${parsed.data.title}-${Date.now()}`, slugs);

  const meetingUrl =
    parsed.data.meetingUrl && parsed.data.meetingUrl.trim() !== ""
      ? parsed.data.meetingUrl.trim()
      : null;

  await prisma.event.create({
    data: {
      title: parsed.data.title.trim(),
      slug,
      description: parsed.data.description.trim(),
      type: parsed.data.type.trim(),
      startAt,
      endAt,
      timezone: parsed.data.timezone?.trim() || null,
      language: parsed.data.language?.trim() || null,
      isVirtual: parsed.data.isVirtual ?? true,
      meetingUrl,
      authorId: user.id,
    },
  });

  await invalidatePublicEventsCache();

  return NextResponse.json({ success: true });
}
