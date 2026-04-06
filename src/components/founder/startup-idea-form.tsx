"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CountrySelect } from "@/components/forms/country-select";
import { COFOUNDER_ROLE_OPTIONS } from "@/lib/cofounder-roles";

export function StartupIdeaForm({ founderId }: { founderId: string }) {
  const t = useTranslations("startupIdea");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    pitch: "",
    publicTeaser: "",
    protectionMode: "FULL_PUBLIC" as "FULL_PUBLIC" | "TEASER_ONLY",
    rolesNeeded: [] as string[],
    coFounderSlotsWanted: 1,
    industries: "",
    country: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/startup-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          founderId,
          rolesNeeded: form.rolesNeeded,
          coFounderSlotsWanted: form.coFounderSlotsWanted,
          industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert((d.error as string) ?? t("postError"));
        return;
      }
      setForm({
        title: "",
        description: "",
        pitch: "",
        publicTeaser: "",
        protectionMode: "FULL_PUBLIC",
        rolesNeeded: [],
        coFounderSlotsWanted: 1,
        industries: "",
        country: "",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function toggleRole(r: string) {
    setForm((f) => ({
      ...f,
      rolesNeeded: f.rolesNeeded.includes(r) ? f.rolesNeeded.filter((x) => x !== r) : [...f.rolesNeeded, r],
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="tc-label">{t("title")}</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="tc-input"
        />
      </div>

      <fieldset className="tc-card-muted space-y-4 p-5">
        <legend className="px-1 text-sm font-semibold text-stone-800">{t("visibility")}</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-white/60">
          <input
            type="radio"
            name="protectionMode"
            checked={form.protectionMode === "FULL_PUBLIC"}
            onChange={() => setForm({ ...form, protectionMode: "FULL_PUBLIC" })}
            className="mt-1 h-4 w-4 border-stone-300 text-brand-green focus:ring-brand-teal/40"
          />
          <span>
            <span className="font-medium">{t("fullPublic")}</span>
            <span className="block text-sm text-stone-600">{t("fullPublicDesc")}</span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-white/60">
          <input
            type="radio"
            name="protectionMode"
            checked={form.protectionMode === "TEASER_ONLY"}
            onChange={() => setForm({ ...form, protectionMode: "TEASER_ONLY" })}
            className="mt-1 h-4 w-4 border-stone-300 text-brand-green focus:ring-brand-teal/40"
          />
          <span>
            <span className="font-medium">{t("teaserOnly")}</span>
            <span className="block text-sm text-stone-600">{t("teaserOnlyDesc")}</span>
          </span>
        </label>
      </fieldset>

      {form.protectionMode === "TEASER_ONLY" && (
        <div>
          <label className="tc-label">{t("publicTeaser")}</label>
          <p className="tc-hint">{t("publicTeaserHint")}</p>
          <textarea
            value={form.publicTeaser}
            onChange={(e) => setForm({ ...form, publicTeaser: e.target.value })}
            required={form.protectionMode === "TEASER_ONLY"}
            minLength={20}
            rows={4}
            className="tc-textarea"
            placeholder={t("teaserPlaceholder")}
          />
        </div>
      )}

      <div>
        <label className="tc-label">{t("description")}</label>
        <p className="tc-hint">
          {form.protectionMode === "TEASER_ONLY" ? t("descriptionHintTeaser") : t("descriptionHintPublic")}
        </p>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          rows={4}
          className="tc-textarea"
        />
      </div>
      <div>
        <label className="tc-label">{t("pitch")}</label>
        <p className="tc-hint">
          {form.protectionMode === "TEASER_ONLY" ? t("pitchHintTeaser") : t("pitchHintPublic")}
        </p>
        <textarea
          value={form.pitch}
          onChange={(e) => setForm({ ...form, pitch: e.target.value })}
          rows={3}
          className="tc-textarea min-h-[4.5rem]"
        />
      </div>
      <div>
        <label className="tc-label">{t("rolesNeeded")}</label>
        <p className="tc-hint">{t("rolesHint")}</p>
        <div className="flex flex-wrap gap-2">
          {COFOUNDER_ROLE_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRole(r)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                form.rolesNeeded.includes(r) ? "tc-chip-active" : "tc-chip"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="tc-label">{t("coFounderSlotsLabel")}</label>
        <p className="tc-hint">{t("coFounderSlotsHint")}</p>
        <input
          type="number"
          min={1}
          max={50}
          value={form.coFounderSlotsWanted}
          onChange={(e) =>
            setForm({
              ...form,
              coFounderSlotsWanted: Math.min(50, Math.max(1, Number.parseInt(e.target.value, 10) || 1)),
            })
          }
          required
          className="tc-input mt-1.5 max-w-[8rem]"
        />
      </div>
      <div>
        <label className="tc-label">{t("industries")}</label>
        <input
          type="text"
          value={form.industries}
          onChange={(e) => setForm({ ...form, industries: e.target.value })}
          placeholder={t("industriesPh")}
          className="tc-input"
        />
      </div>
      <div>
        <label className="tc-label">{t("country")}</label>
        <CountrySelect
          value={form.country}
          onChange={(code) => setForm({ ...form, country: code })}
          placeholder={tCommon("select")}
          className="tc-select mt-1.5 w-full"
        />
      </div>
      <button type="submit" disabled={loading} className="tc-btn-primary px-8 py-3.5 text-base disabled:opacity-50">
        {loading ? t("posting") : t("postIdea")}
      </button>
    </form>
  );
}
