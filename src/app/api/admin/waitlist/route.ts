import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 40;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const q = searchParams.get("q")?.trim();
  const country = searchParams.get("country")?.trim();
  const language = searchParams.get("language")?.trim();
  const role = searchParams.get("role")?.trim();

  const where: Prisma.WaitlistEntryWhereInput = {};
  if (q) {
    where.email = { contains: q, mode: "insensitive" };
  }
  if (country) where.country = country;
  if (language) where.language = language;
  if (role) where.role = role;

  const [total, entries] = await Promise.all([
    prisma.waitlistEntry.count({ where }),
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({ entries, total, page, pageSize: PAGE_SIZE });
}
