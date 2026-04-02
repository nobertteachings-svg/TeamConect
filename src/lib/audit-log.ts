import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  reason?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? undefined,
      reason: input.reason ?? null,
    },
  });
}
