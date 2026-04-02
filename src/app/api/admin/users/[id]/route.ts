import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { writeAuditLog } from "@/lib/audit-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      roles: true,
      accountDisabled: true,
      founderProfile: { select: { verified: true } },
      investorProfile: { select: { verified: true } },
      mentorProfile: { select: { verified: true } },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

const ALL_ROLES: UserRole[] = ["FOUNDER", "INVESTOR", "MENTOR", "ADMIN"];

function normalizeRoles(input: unknown): UserRole[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) return undefined;
  const out = new Set<UserRole>();
  for (const r of input) {
    if (typeof r === "string" && ALL_ROLES.includes(r as UserRole)) {
      out.add(r as UserRole);
    }
  }
  if (out.size === 0) return [UserRole.FOUNDER];
  return Array.from(out);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = (await request.json()) as {
    roles?: unknown;
    accountDisabled?: boolean;
    reason?: string;
    founderVerified?: boolean;
    investorVerified?: boolean;
    mentorVerified?: boolean;
  };

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      roles: true,
      founderProfile: { select: { id: true } },
      investorProfile: { select: { id: true } },
      mentorProfile: { select: { id: true } },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newRoles = normalizeRoles(body.roles);
  const togglesFounder =
    typeof body.founderVerified === "boolean" && Boolean(target.founderProfile);
  const togglesInvestor =
    typeof body.investorVerified === "boolean" && Boolean(target.investorProfile);
  const togglesMentor =
    typeof body.mentorVerified === "boolean" && Boolean(target.mentorProfile);
  const hasUserFields =
    newRoles !== undefined ||
    typeof body.accountDisabled === "boolean" ||
    togglesFounder ||
    togglesInvestor ||
    togglesMentor;
  if (!hasUserFields) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }
  if (newRoles) {
    const wasAdmin = target.roles.includes("ADMIN");
    const willBeAdmin = newRoles.includes("ADMIN");
    if (wasAdmin && !willBeAdmin) {
      const adminCount = await prisma.user.count({
        where: { roles: { has: "ADMIN" } },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
      }
    }
  }

  const reason = body.reason?.trim() || null;

  await prisma.$transaction(async (tx) => {
    const data: { roles?: UserRole[]; accountDisabled?: boolean } = {};
    if (newRoles) data.roles = newRoles;
    if (typeof body.accountDisabled === "boolean") data.accountDisabled = body.accountDisabled;

    if (Object.keys(data).length > 0) {
      await tx.user.update({ where: { id }, data });
    }

    if (togglesFounder && target.founderProfile) {
      await tx.founderProfile.update({
        where: { id: target.founderProfile.id },
        data: { verified: body.founderVerified },
      });
    }
    if (togglesInvestor && target.investorProfile) {
      await tx.investorProfile.update({
        where: { id: target.investorProfile.id },
        data: { verified: body.investorVerified },
      });
    }
    if (togglesMentor && target.mentorProfile) {
      await tx.mentorProfile.update({
        where: { id: target.mentorProfile.id },
        data: { verified: body.mentorVerified },
      });
    }
  });

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "user.update",
    targetType: "User",
    targetId: id,
    metadata: {
      roles: newRoles,
      accountDisabled: body.accountDisabled,
      founderVerified: body.founderVerified,
      investorVerified: body.investorVerified,
      mentorVerified: body.mentorVerified,
    },
    reason,
  });

  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
      accountDisabled: true,
      founderProfile: { select: { verified: true } },
      investorProfile: { select: { verified: true } },
      mentorProfile: { select: { verified: true } },
    },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  if (id === admin.adminUser.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { roles: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.roles.includes("ADMIN")) {
    const adminCount = await prisma.user.count({ where: { roles: { has: "ADMIN" } } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last admin" }, { status: 400 });
    }
  }

  let reason: string | null = null;
  try {
    const body = await request.json();
    reason = typeof body?.reason === "string" ? body.reason.trim() || null : null;
  } catch {
    /* no body */
  }

  await writeAuditLog({
    actorId: admin.adminUser.id,
    action: "user.delete",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email },
    reason,
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
