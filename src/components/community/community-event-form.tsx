"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const EVENT_TYPES = [
  "hackathon",
  "conference",
  "meetup",
  "workshop",
  "webinar",
  "tech_talk",
  "other",
] as const;

export function CommunityEventForm({ isSignedIn }: { isSignedIn: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("community");
  const tCommon = useTranslations("common");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "meetup" as (typeof EVENT_TYPES)[number],
    startAt: "",
    endAt: "",
    meetingUrl: "",
    isVirtual: true,
  });

  if (!isSignedIn) {
    return (
      <div className="tc-card border border-dashed border-stone-300 bg-stone-50/80 p-6 text-center">
        <p className="text-sm text-stone-600">{t("postEventSignInLead")}</p>
        <Link
          href={`/${locale}/sign-in`}
          className="mt-3 inline-flex rounded-xl bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
        >
          {tCommon("signIn")}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.startAt || !form.endAt) {
      setErr(t("postEventDatesRequired"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/community/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          type: form.type,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          meetingUrl: form.meetingUrl.trim() || undefined,
          isVirtual: form.isVirtual,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? tCommon("failed"));
        return;
      }
      setForm({
        title: "",
        description: "",
        type: "meetup",
        startAt: "",
        endAt: "",
        meetingUrl: "",
        isVirtual: true,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tc-card p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">{t("postEventTitle")}</h2>
      <p className="mt-2 text-sm text-stone-600">{t("postEventLead")}</p>
      {err && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>}
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="tc-label">{t("postEventFieldTitle")}</label>
          <input
            className="tc-input mt-1 w-full"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            minLength={3}
            maxLength={200}
            disabled={busy}
            placeholder={t("postEventFieldTitlePh")}
          />
        </div>
        <div>
          <label className="tc-label">{t("postEventFieldType")}</label>
          <select
            className="tc-input mt-1 w-full"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as (typeof EVENT_TYPES)[number] })}
            disabled={busy}
          >
            {EVENT_TYPES.map((key) => (
              <option key={key} value={key}>
                {t(`eventTypes.${key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isVirtual}
              onChange={(e) => setForm({ ...form, isVirtual: e.target.checked })}
              disabled={busy}
            />
            {t("postEventVirtual")}
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="tc-label">{t("postEventFieldDescription")}</label>
          <textarea
            className="tc-input mt-1 w-full resize-y"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            minLength={10}
            maxLength={8000}
            disabled={busy}
            placeholder={t("postEventFieldDescriptionPh")}
          />
        </div>
        <div>
          <label className="tc-label">{t("postEventStart")}</label>
          <input
            type="datetime-local"
            className="tc-input mt-1 w-full"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
            disabled={busy}
          />
        </div>
        <div>
          <label className="tc-label">{t("postEventEnd")}</label>
          <input
            type="datetime-local"
            className="tc-input mt-1 w-full"
            value={form.endAt}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            required
            disabled={busy}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="tc-label">{t("postEventUrl")}</label>
          <input
            type="url"
            className="tc-input mt-1 w-full"
            value={form.meetingUrl}
            onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
            disabled={busy}
            placeholder="https://"
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="tc-btn-primary px-6 py-2.5 disabled:opacity-50">
            {busy ? tCommon("loading") : t("postEventSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}
