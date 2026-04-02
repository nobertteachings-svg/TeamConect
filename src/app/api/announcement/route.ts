import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Public: active site banner text (if any) */
export async function GET() {
  const active = await prisma.siteAnnouncement.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, message: true, updatedAt: true },
  });

  return NextResponse.json({ announcement: active });
}
