import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";
import { generateSlug } from "@/lib/utils";
import { refreshIdeaRecruitingStatus } from "@/lib/team-sync";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = (await request.json()) as {
    isPublic?: boolean;
    status?: string;
    slug?: string;
    featured?: boolean;
    softDelete?: boolean;
    restore?: boolean;
    reason?: string;
    coFounderSlotsWanted?: number;
  };

  const existing = await prisma.startupIdea.findUnique({
    where: { id },
    select: { id: true, slug: true, title: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const data: {
    isPublic?: boolean;
    status?: string;
    slug?: string;
    featured?: boolean;
    deletedAt?: Date | null;
    coFounderSlotsWanted?: number;
  } = {};

  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
  if (typeof body.status === "string" && body.status.trim()) data.status = body.status.trim();
  if (typeof body.featured === "boolean") data.featured = body.featured;
  if (
    typeof body.coFounderSlotsWanted === "number" &&
    Number.isInteger(body.coFounderSlotsWanted) &&
    body.coFounderSlotsWanted >= 1 &&
    body.coFounderSlotsWanted <= 50
  ) {
    data.coFounderSlotsWanted = body.coFounderSlotsWanted;
  }

  if (body.restore === true) {
    data.deletedAt = null;
  } else if (body.softDelete === true) {
    data.deletedAt = new Date();
    data.isPublic = false;
  }

  if (typeof body.slug === "string" && body.slug.trim()) {
    const desired = body.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const taken = await prisma.startupIdea.findFirst({
      where: { slug: desired, NOT: { id } },
      select: { id: true },
    });
    if (taken) {
      const all = (await prisma.startupIdea.findMany({ select: { slug: true } })).map((i) => i.slug);
      data.slug = generateSlug(desired, all);
    } else {
      data.slug = desired;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const shouldRefreshSlots = data.coFounderSlotsWanted !== undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.startupIdea.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        isPublic: true,
        status: true,
        featured: true,
        deletedAt: true,
      },
    });
    if (shouldRefreshSlots) {
      await refreshIdeaRecruitingStatus(tx, id);
      return tx.startupIdea.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          isPublic: true,
          status: true,
          featured: true,
          deletedAt: true,
        },
      });
    }
    return row;
  });

  const meta: Record<string, Prisma.InputJsonValue> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) meta[k] = v.toISOString();
    else if (v !== undefined) meta[k] = v as Prisma.InputJsonValue;
  }

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "idea.update",
    targetType: "StartupIdea",
    targetId: id,
    metadata: meta as Prisma.InputJsonValue,
    reason: body.reason?.trim() || null,
  });

  return NextResponse.json({ idea: updated });
}
