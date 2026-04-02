import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const country = searchParams.get("country")?.trim();

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }
  if (country) where.country = country;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        preferredLang: true,
        country: true,
        roles: true,
        accountDisabled: true,
        createdAt: true,
        lastLoginAt: true,
        accounts: { select: { provider: true } },
        founderProfile: { select: { id: true, verified: true } },
        investorProfile: { select: { id: true, verified: true } },
        mentorProfile: { select: { id: true, verified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize: PAGE_SIZE });
}
