import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { sendNewCoFounderApplicationEmail } from "@/lib/mail";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { cofounderApplicationBodySchema } from "@/lib/schemas/public-api";

const COMMITMENT_LABEL: Record<"5-10" | "10-20" | "20-40" | "40+", string> = {
  "5-10": "5–10 hours per week",
  "10-20": "10–20 hours per week",
  "20-40": "20–40 hours per week",
  "40+": "40+ hours per week (full-time or equivalent)",
};

export async function POST(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = cofounderApplicationBodySchema.parse(body);

    const idea = await prisma.startupIdea.findFirst({
      where: { id: data.ideaId, isPublic: true, deletedAt: null },
      include: {
        founder: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });
    if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    if (idea.founder.user.id === session.user.id) {
      return NextResponse.json({ error: "You cannot apply to your own idea" }, { status: 400 });
    }

    const existing = await prisma.coFounderApplication.findUnique({
      where: { ideaId_userId: { ideaId: data.ideaId, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already applied" }, { status: 400 });

    const availability = COMMITMENT_LABEL[data.commitmentKey];
    const fullMessage = `Availability: ${availability}\n\n${data.message.trim()}`;

    await prisma.coFounderApplication.create({
      data: {
        ideaId: data.ideaId,
        userId: session.user.id,
        message: fullMessage,
        roleOffer: data.roleOffer ?? null,
      },
    });

    const applicant = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    const founderEmail = idea.founder.user.email?.trim();
    if (founderEmail) {
      const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamconnect.com").replace(/\/$/, "");
      const applicantLabel = applicant?.name?.trim() || applicant?.email?.trim() || "A candidate";
      void sendNewCoFounderApplicationEmail({
        to: founderEmail,
        ideaTitle: idea.title,
        applicantLabel,
        dashboardUrl: `${base}/en/dashboard/cofounders/${idea.id}`,
        ideaPublicUrl: `${base}/en/cofounders/${idea.slug}`,
      }).catch((err) => console.error("Co-founder application notification email:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}
