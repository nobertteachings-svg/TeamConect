import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: { select: { provider: true, type: true } },
      founderProfile: {
        include: {
          ideas: {
            select: {
              id: true,
              title: true,
              slug: true,
              stage: true,
              isPublic: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      investorProfile: true,
      mentorProfile: true,
      coFounderApplications: {
        include: {
          idea: { select: { id: true, title: true, slug: true } },
        },
      },
      waitlist: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLang: user.preferredLang,
      country: user.country,
      roles: user.roles,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      accounts: user.accounts,
      founderProfile: user.founderProfile,
      investorProfile: user.investorProfile,
      mentorProfile: user.mentorProfile,
      coFounderApplications: user.coFounderApplications,
      waitlist: user.waitlist,
    },
  });
}
