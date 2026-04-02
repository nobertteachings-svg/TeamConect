import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const rows = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = ["email", "role", "country", "language", "source", "createdAt"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvEscape(r.email),
        csvEscape(r.role ?? ""),
        csvEscape(r.country ?? ""),
        csvEscape(r.language ?? ""),
        csvEscape(r.source ?? ""),
        csvEscape(r.createdAt.toISOString()),
      ].join(",")
    ),
  ];

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
