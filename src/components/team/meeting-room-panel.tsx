"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

export type MeetingRoomMeeting = {
  id: string;
  title: string;
  startsAt: string | null;
  meetingUrl: string | null;
  notes: string | null;
};

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null; image: string | null };
};

type Res = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  createdAt: string;
  author: { id: string; name: string | null };
};

function jitsiRoomName(teamId: string, meetingId: string): string {
  const a = teamId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) || "team";
  const b = meetingId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 14) || "meet";
  return `TeamConect-${a}-${b}`;
}

function googleCalendarUrl(title: string, start: Date, end: Date, details?: string): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (details?.trim()) p.set("details", details.trim().slice(0, 1500));
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function MeetingRoomPanel({
  teamId,
  meeting,
  currentUserId,
  onClose,
}: {
  teamId: string;
  meeting: MeetingRoomMeeting;
  currentUserId: string;
  onClose: () => void;
}) {
  const t = useTranslations("teamWorkspace.meetingRoom");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [resources, setResources] = useState<Res[]>([]);
  const [chatBody, setChatBody] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showJitsi, setShowJitsi] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const room = jitsiRoomName(teamId, meeting.id);
  const jitsiSrc = `https://meet.jit.si/${encodeURIComponent(room)}#config.prejoinPageEnabled=false`;

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/meetings/${meeting.id}/messages`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages ?? []);
  }, [teamId, meeting.id]);

  const loadResources = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/resources?meetingId=${encodeURIComponent(meeting.id)}`);
    if (!res.ok) return;
    const data = (await res.json()) as { resources: Res[] };
    setResources(data.resources ?? []);
  }, [teamId, meeting.id]);

  useEffect(() => {
    void loadMessages();
    void loadResources();
  }, [loadMessages, loadResources]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadMessages();
    }, 2800);
    return () => window.clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const body = chatBody.trim();
    if (!body) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/meetings/${meeting.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setChatBody("");
      await loadMessages();
    } finally {
      setBusy(false);
    }
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resTitle.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resTitle.trim(),
          url: resUrl.trim() || undefined,
          meetingId: meeting.id,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(d.error ?? t("errorGeneric"));
        return;
      }
      setResTitle("");
      setResUrl("");
      await loadResources();
    } finally {
      setBusy(false);
    }
  }

  const start = meeting.startsAt ? new Date(meeting.startsAt) : new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const gcal =
    meeting.startsAt || meeting.title
      ? googleCalendarUrl(meeting.title, start, end, meeting.notes ?? undefined)
      : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-room-title"
    >
      <div className="flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-tc-md sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="meeting-room-title" className="text-lg font-bold text-brand-green">
              {meeting.title}
            </h2>
            {meeting.startsAt && (
              <p className="text-sm text-stone-600">
                {new Date(meeting.startsAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`/api/teams/${teamId}/meetings/${meeting.id}/ics`}
                className="text-xs font-semibold text-brand-teal hover:underline"
              >
                {t("downloadIcs")}
              </a>
              {gcal && (
                <a
                  href={gcal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-teal hover:underline"
                >
                  {t("addGoogleCal")}
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            {t("close")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {err && (
            <p className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
          )}

          <div className="border-b border-stone-200 p-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowJitsi(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  showJitsi ? "bg-brand-green text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                {t("tabInAppVideo")}
              </button>
              {meeting.meetingUrl && (
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-stone-200"
                >
                  {t("openZoomLink")}
                </a>
              )}
            </div>
            {showJitsi && (
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-900/5">
                <p className="border-b border-stone-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {t("jitsiHint")}
                </p>
                <iframe
                  title={t("jitsiFrameTitle")}
                  src={jitsiSrc}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="aspect-video w-full min-h-[220px] bg-black sm:min-h-[320px]"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="tc-card flex flex-col p-4" style={{ minHeight: "280px" }}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500">{t("liveChat")}</h3>
              <div className="mb-3 max-h-52 flex-1 space-y-2 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50/80 p-2 text-sm">
                {messages.length === 0 && <p className="text-stone-500">{t("chatEmpty")}</p>}
                {messages.map((m) => (
                  <div key={m.id} className="rounded-md bg-white px-2 py-1.5 shadow-sm">
                    <span className="font-semibold text-stone-800">
                      {m.author.id === currentUserId ? t("you") : m.author.name ?? m.author.email ?? "—"}
                    </span>
                    <span className="ml-2 text-xs text-stone-400">
                      {new Date(m.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                    </span>
                    <p className="mt-0.5 whitespace-pre-wrap text-stone-700">{m.body}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendChat} className="flex gap-2">
                <input
                  className="tc-input min-w-0 flex-1 text-sm"
                  value={chatBody}
                  onChange={(e) => setChatBody(e.target.value)}
                  placeholder={t("chatPlaceholder")}
                  disabled={busy}
                  maxLength={4000}
                />
                <button type="submit" disabled={busy || !chatBody.trim()} className="tc-btn-primary shrink-0 px-4 text-sm">
                  {t("send")}
                </button>
              </form>
            </div>

            <div className="tc-card p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500">{t("meetingResources")}</h3>
              <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto text-sm">
                {resources.length === 0 && <li className="text-stone-500">{t("noResources")}</li>}
                {resources.map((r) => (
                  <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-2 py-1.5">
                    <span className="font-medium text-brand-green">{r.title}</span>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-brand-teal hover:underline">
                        ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={addResource} className="space-y-2 border-t border-stone-100 pt-3">
                <input
                  className="tc-input w-full text-sm"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder={t("resTitlePh")}
                  disabled={busy}
                />
                <input
                  className="tc-input w-full text-sm"
                  type="url"
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://"
                  disabled={busy}
                />
                <button type="submit" disabled={busy || !resTitle.trim()} className="tc-btn-primary w-full text-sm">
                  {t("addResourceMeeting")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
