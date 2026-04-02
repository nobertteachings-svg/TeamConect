import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { isValidCountryCode } from "@/lib/countries-full";
import { checkApiRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  headline: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()),
  seekingRole: z.string().optional(),
  ideaStage: z.string().optional(),
  commitmentLevel: z.string().optional(),
  industries: z.array(z.string()),
  languages: z.array(z.string()),
  country: z.string().optional(),
});

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
      { error: "Add your country to your account before editing your founder profile." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = schema.parse(body);

    let profileCountry: string | null =
      data.country?.trim() ? data.country.trim().toUpperCase() : null;
    if (profileCountry && !isValidCountryCode(profileCountry)) {
      return NextResponse.json({ error: "Invalid country" }, { status: 400 });
    }
    if (profileCountry === "") profileCountry = null;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    await prisma.founderProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        headline: data.headline ?? null,
        bio: data.bio ?? null,
        skills: data.skills ?? [],
        seekingRole: data.seekingRole ?? null,
        ideaStage: (data.ideaStage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED") ?? null,
        commitmentLevel: data.commitmentLevel ?? null,
        industries: data.industries ?? [],
        languages: data.languages ?? [],
        country: profileCountry,
      },
      update: {
        headline: data.headline ?? null,
        bio: data.bio ?? null,
        skills: data.skills ?? [],
        seekingRole: data.seekingRole ?? null,
        ideaStage: (data.ideaStage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED") ?? null,
        commitmentLevel: data.commitmentLevel ?? null,
        industries: data.industries ?? [],
        languages: data.languages ?? [],
        country: profileCountry,
      },
    });

    if (user && !user.roles.includes("FOUNDER")) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { roles: [...user.roles, "FOUNDER"] },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
