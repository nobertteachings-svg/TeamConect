import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);

  const [
    usersTotal,
    usersWeek,
    ideasTotal,
    ideasWeek,
    applicationsTotal,
    applicationsWeek,
    waitlistTotal,
    waitlistWeek,
    topCountries,
    topLanguages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.startupIdea.count({ where: { deletedAt: null } }),
    prisma.startupIdea.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
    prisma.coFounderApplication.count(),
    prisma.coFounderApplication.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.groupBy({
      by: ["country"],
      _count: { id: true },
      where: { country: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.user.groupBy({
      by: ["preferredLang"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
  ]);

  const health = {
    email: Boolean(process.env.RESEND_API_KEY),
    redis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    databaseUrl: Boolean(process.env.DATABASE_URL),
  };

  return NextResponse.json({
    totals: {
      users: usersTotal,
      ideas: ideasTotal,
      applications: applicationsTotal,
      waitlist: waitlistTotal,
    },
    last7Days: {
      users: usersWeek,
      ideas: ideasWeek,
      applications: applicationsWeek,
      waitlist: waitlistWeek,
    },
    topCountries: topCountries.map((r) => ({
      country: r.country,
      count: r._count.id,
    })),
    topLanguages: topLanguages.map((r) => ({
      language: r.preferredLang,
      count: r._count.id,
    })),
    health,
  });
}
