import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const status = searchParams.get("status")?.trim();
  const ideaId = searchParams.get("ideaId")?.trim();
  const userId = searchParams.get("userId")?.trim();

  const where: Prisma.CoFounderApplicationWhereInput = {};
  if (status) where.status = status;
  if (ideaId) where.ideaId = ideaId;
  if (userId) where.userId = userId;

  const [total, applications] = await Promise.all([
    prisma.coFounderApplication.count({ where }),
    prisma.coFounderApplication.findMany({
      where,
      select: {
        id: true,
        status: true,
        roleOffer: true,
        message: true,
        adminNote: true,
        createdAt: true,
        idea: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({ applications, total, page, pageSize: PAGE_SIZE });
}
