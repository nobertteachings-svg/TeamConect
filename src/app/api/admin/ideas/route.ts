import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { StartupStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const q = searchParams.get("q")?.trim();
  const stage = searchParams.get("stage")?.trim();
  const country = searchParams.get("country")?.trim();
  const isPublic = searchParams.get("isPublic");
  const protectionMode = searchParams.get("protectionMode")?.trim();
  const status = searchParams.get("status")?.trim();
  const featured = searchParams.get("featured");
  const deleted = searchParams.get("deleted");

  const where: Prisma.StartupIdeaWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (stage && Object.values(StartupStage).includes(stage as StartupStage)) {
    where.stage = stage as StartupStage;
  }
  if (country) where.country = country;
  if (isPublic === "true") where.isPublic = true;
  if (isPublic === "false") where.isPublic = false;
  if (protectionMode === "FULL_PUBLIC" || protectionMode === "TEASER_ONLY") {
    where.protectionMode = protectionMode;
  }
  if (status) where.status = status;
  if (featured === "true") where.featured = true;
  if (featured === "false") where.featured = false;
  if (deleted === "true") where.deletedAt = { not: null };
  if (deleted === "false") where.deletedAt = null;

  const [total, ideas] = await Promise.all([
    prisma.startupIdea.count({ where }),
    prisma.startupIdea.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        stage: true,
        status: true,
        isPublic: true,
        featured: true,
        protectionMode: true,
        country: true,
        deletedAt: true,
        createdAt: true,
        founder: {
          select: {
            id: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({ ideas, total, page, pageSize: PAGE_SIZE });
}
