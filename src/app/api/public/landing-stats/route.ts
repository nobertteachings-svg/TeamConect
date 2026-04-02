import { NextResponse } from "next/server";
import { getLandingStats } from "@/lib/landing-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getLandingStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
