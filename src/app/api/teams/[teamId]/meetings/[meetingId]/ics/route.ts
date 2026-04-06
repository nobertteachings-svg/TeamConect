import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-config";
import { assertTeamMember, assertTeamMeeting } from "@/lib/team-access";

function formatIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string; meetingId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, meetingId } = await params;
  const membership = await assertTeamMember(teamId, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meeting = await assertTeamMeeting(teamId, meetingId);
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = meeting.startsAt ?? meeting.createdAt;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const uid = `${meeting.id}@teamconnect`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TeamConnect//Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(meeting.title)}`,
  ];
  if (meeting.notes?.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(meeting.notes.trim())}`);
  }
  if (meeting.meetingUrl?.trim()) {
    lines.push(`URL:${meeting.meetingUrl.trim()}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  const ics = lines.join("\r\n") + "\r\n";

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting-${meeting.id.slice(0, 8)}.ics"`,
    },
  });
}
