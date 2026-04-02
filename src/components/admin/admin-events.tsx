"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const ADMIN_EVENT_TYPES = [
  "hackathon",
  "conference",
  "meetup",
  "workshop",
  "webinar",
  "tech_talk",
  "other",
] as const;

export function AdminEvents() {
  const t = useTranslations("admin");
  const tCommunity = useTranslations("community");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "webinar" as (typeof ADMIN_EVENT_TYPES)[number],
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    meetingUrl: "",
  });

  function load() {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.refresh();
      const d = await res.json();
      setEvents((ev) => [...ev, d.event]);
      setForm({
        title: "",
        description: "",
        type: "webinar",
        startAt: new Date().toISOString().slice(0, 16),
        endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        meetingUrl: "",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("deleteEventConfirm"))) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((ev) => ev.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  if (loading) return <p>{tCommon("loading")}</p>;

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="max-w-md space-y-2">
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={t("eventTitle")}
          required
          className="tc-input"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={t("description")}
          rows={2}
          className="tc-input"
        />
        <select
          className="tc-input"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as (typeof ADMIN_EVENT_TYPES)[number] })}
        >
          {ADMIN_EVENT_TYPES.map((key) => (
            <option key={key} value={key}>
              {tCommunity(`eventTypes.${key}`)}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          className="tc-input"
        />
        <input
          type="datetime-local"
          value={form.endAt}
          onChange={(e) => setForm({ ...form, endAt: e.target.value })}
          className="tc-input"
        />
        <input
          value={form.meetingUrl}
          onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
          placeholder={t("meetingUrl")}
          className="tc-input"
        />
        <button type="submit" className="tc-btn-primary">
          {t("addEvent")}
        </button>
      </form>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="tc-card flex items-center justify-between gap-2 p-3">
            <span>{ev.title}</span>
            <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => handleDelete(ev.id)}>
              {t("delete")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
