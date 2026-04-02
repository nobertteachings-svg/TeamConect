import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { invalidatePublicEventsCache } from "@/lib/redis";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.event.findMany({ orderBy: { startAt: "desc" } });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, type, startAt, endAt, meetingUrl } = body;

  const slugs = (await prisma.event.findMany({ select: { slug: true } })).map((e) => e.slug);
  const slug = generateSlug(title + "-" + Date.now(), slugs);

  const event = await prisma.event.create({
    data: {
      title,
      slug,
      description: description ?? "",
      type: type ?? "webinar",
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      meetingUrl: meetingUrl ?? null,
      isVirtual: true,
      authorId: user.id,
    },
  });

  await invalidatePublicEventsCache();

  return NextResponse.json({ event });
}
