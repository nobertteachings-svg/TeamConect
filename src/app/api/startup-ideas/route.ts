import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { generateSlug } from "@/lib/utils";
import { isValidCountryCode } from "@/lib/countries-full";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { startupIdeaPostBodySchema } from "@/lib/schemas/public-api";

export async function POST(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { country: true },
  });
  if (!account?.country?.trim()) {
    return NextResponse.json(
      { error: "Add your country to your account before posting ideas." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = startupIdeaPostBodySchema.parse(body);

    let ideaCountry: string | null = data.country?.trim() ? data.country.trim().toUpperCase() : null;
    if (ideaCountry && !isValidCountryCode(ideaCountry)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    if (ideaCountry === "") ideaCountry = null;

    const founder = await prisma.founderProfile.findFirst({
      where: { id: data.founderId, userId: session.user.id },
    });
    if (!founder) {
      return NextResponse.json({ error: "Founder profile not found" }, { status: 404 });
    }

    const slugs = (await prisma.startupIdea.findMany({ select: { slug: true } })).map(
      (i) => i.slug
    );
    const slug = generateSlug(data.title, slugs);

    await prisma.startupIdea.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        pitch: data.pitch ?? null,
        publicTeaser:
          data.protectionMode === "TEASER_ONLY" ? data.publicTeaser?.trim() ?? null : null,
        protectionMode: data.protectionMode,
        rolesNeeded: data.rolesNeeded,
        industries: data.industries,
        country: ideaCountry,
        founderId: data.founderId,
        coFounderSlotsWanted: data.coFounderSlotsWanted,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
