import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Readiness probe: 200 when the database answers; 503 otherwise.
 * Use for orchestrators and synthetic monitoring (not for public abuse — keep URL private if needed).
 */
export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }

  const body = {
    status: database ? "healthy" : "degraded",
    database,
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: database ? 200 : 503 });
}
