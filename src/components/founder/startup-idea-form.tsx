"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CountrySelect } from "@/components/forms/country-select";
import { COFOUNDER_ROLE_OPTIONS } from "@/lib/cofounder-roles";

function FormSection({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm ring-1 ring-stone-100/80 sm:p-6">
      <header className="mb-5 border-b border-stone-100 pb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green">{title}</h3>
        {blurb ? <p className="mt-2 text-sm leading-relaxed text-stone-600">{blurb}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

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
    <form onSubmit={handleSubmit} className="min-w-0 max-w-2xl space-y-8">
      <FormSection title={t("sectionBasics")} blurb={t("sectionBasicsBlurb")}>
        <div>
          <label className="tc-label" htmlFor="startup-idea-title">
            {t("title")}
          </label>
          <input
            id="startup-idea-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="tc-input"
            autoComplete="off"
          />
        </div>
      </FormSection>

      <FormSection title={t("sectionPrivacy")} blurb={t("sectionPrivacyBlurb")}>
        <fieldset className="space-y-0 border-0 p-0">
          <legend className="sr-only">{t("visibility")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
                form.protectionMode === "FULL_PUBLIC"
                  ? "border-brand-green bg-brand-green/[0.04] ring-1 ring-brand-green/20"
                  : "border-stone-200 bg-stone-50/40 hover:border-stone-300"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="protectionMode"
                  checked={form.protectionMode === "FULL_PUBLIC"}
                  onChange={() => setForm({ ...form, protectionMode: "FULL_PUBLIC" })}
                  className="mt-1 h-4 w-4 shrink-0 border-stone-300 text-brand-green focus:ring-brand-teal/40"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-stone-900">{t("fullPublic")}</span>
                  <span className="mt-1 block text-sm text-stone-600">{t("fullPublicCardLine")}</span>
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition ${
                form.protectionMode === "TEASER_ONLY"
                  ? "border-amber-400/80 bg-amber-50/50 ring-1 ring-amber-200/60"
                  : "border-stone-200 bg-stone-50/40 hover:border-stone-300"
              }`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="protectionMode"
                  checked={form.protectionMode === "TEASER_ONLY"}
                  onChange={() => setForm({ ...form, protectionMode: "TEASER_ONLY" })}
                  className="mt-1 h-4 w-4 shrink-0 border-stone-300 text-brand-green focus:ring-brand-teal/40"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-stone-900">{t("teaserOnly")}</span>
                  <span className="mt-1 block text-sm text-stone-600">{t("teaserOnlyCardLine")}</span>
                </span>
              </span>
            </label>
          </div>
          <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-600">
            {form.protectionMode === "FULL_PUBLIC" ? t("fullPublicDesc") : t("teaserOnlyDesc")}
          </p>
        </fieldset>

        {form.protectionMode === "TEASER_ONLY" && (
          <div className="border-t border-dashed border-stone-200 pt-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-800/90">{t("sectionTeaser")}</p>
            <p className="mb-3 text-sm text-stone-600">{t("sectionTeaserBlurb")}</p>
            <label className="tc-label" htmlFor="startup-idea-teaser">
              {t("publicTeaser")}
            </label>
            <p className="tc-hint">{t("publicTeaserHint")}</p>
            <textarea
              id="startup-idea-teaser"
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
      </FormSection>

      <FormSection title={t("sectionStory")} blurb={t("sectionStoryBlurb")}>
        <div>
          <label className="tc-label" htmlFor="startup-idea-description">
            {t("description")}
          </label>
          <p className="tc-hint">
            {form.protectionMode === "TEASER_ONLY" ? t("descriptionHintTeaser") : t("descriptionHintPublic")}
          </p>
          <textarea
            id="startup-idea-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={5}
            className="tc-textarea min-h-[7rem]"
          />
        </div>
        <div>
          <label className="tc-label" htmlFor="startup-idea-pitch">
            {t("pitch")}
          </label>
          <p className="tc-hint">
            {form.protectionMode === "TEASER_ONLY" ? t("pitchHintTeaser") : t("pitchHintPublic")}
          </p>
          <textarea
            id="startup-idea-pitch"
            value={form.pitch}
            onChange={(e) => setForm({ ...form, pitch: e.target.value })}
            rows={3}
            className="tc-textarea min-h-[4.5rem]"
          />
        </div>
      </FormSection>

      <FormSection title={t("sectionTeam")} blurb={t("sectionTeamBlurb")}>
        <div>
          <p className="tc-label">{t("rolesNeeded")}</p>
          <p className="tc-hint">{t("rolesHint")}</p>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {COFOUNDER_ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => toggleRole(r)}
                className={`rounded-full px-3 py-1.5 text-left text-sm font-medium transition sm:px-3.5 sm:py-1.5 ${
                  form.rolesNeeded.includes(r) ? "tc-chip-active" : "tc-chip"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="tc-label" htmlFor="startup-idea-slots">
              {t("coFounderSlotsLabel")}
            </label>
            <p className="tc-hint">{t("coFounderSlotsHint")}</p>
          </div>
          <input
            id="startup-idea-slots"
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
            className="tc-input w-full max-w-[6.5rem] shrink-0 sm:mt-0"
          />
        </div>
      </FormSection>

      <FormSection title={t("sectionMeta")} blurb={t("sectionMetaBlurb")}>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0 sm:col-span-1">
            <label className="tc-label" htmlFor="startup-idea-industries">
              {t("industries")}
            </label>
            <p className="tc-hint">{t("industriesHint")}</p>
            <input
              id="startup-idea-industries"
              type="text"
              value={form.industries}
              onChange={(e) => setForm({ ...form, industries: e.target.value })}
              placeholder={t("industriesPh")}
              className="tc-input"
            />
          </div>
          <div className="min-w-0 sm:col-span-1">
            <label className="tc-label">{t("country")}</label>
            <p className="tc-hint">{t("countryHint")}</p>
            <CountrySelect
              value={form.country}
              onChange={(code) => setForm({ ...form, country: code })}
              placeholder={tCommon("select")}
              className="tc-select mt-1.5 w-full"
            />
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={loading} className="tc-btn-primary w-full px-8 py-3.5 text-base disabled:opacity-50 sm:w-auto">
          {loading ? t("posting") : t("postIdea")}
        </button>
      </div>
    </form>
  );
}
