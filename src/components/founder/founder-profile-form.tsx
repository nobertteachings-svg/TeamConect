"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FOUNDER_SEEKING_ROLE_OPTIONS } from "@/lib/cofounder-roles";
import { CountrySelect } from "@/components/forms/country-select";
import { isValidCountryCode } from "@/lib/countries-full";

const STAGES = ["IDEA", "VALIDATING", "BUILDING", "LAUNCHED", "FUNDED"] as const;

type Profile = {
  id: string;
  headline: string | null;
  bio: string | null;
  skills: string[];
  seekingRole: string | null;
  ideaStage: string | null;
  commitmentLevel: string | null;
  industries: string[];
  languages: string[];
  country: string | null;
} | null;

export function FounderProfileForm({ profile }: { profile: Profile; userId: string }) {
  const t = useTranslations("founderProfile");
  const tStages = useTranslations("startupStages");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    skills: profile?.skills?.join(", ") ?? "",
    seekingRole: profile?.seekingRole ?? "",
    ideaStage: profile?.ideaStage ?? "IDEA",
    commitmentLevel: profile?.commitmentLevel ?? "Full-time",
    industries: profile?.industries?.join(", ") ?? "",
    languages: profile?.languages?.join(", ") ?? "",
    country:
      profile?.country && isValidCountryCode(profile.country)
        ? profile.country.trim().toUpperCase()
        : "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/founder/profile", {
        method: profile ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
          languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div>
        <label className="tc-label">{t("headline")}</label>
        <input
          type="text"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className="tc-input"
        />
      </div>
      <div>
        <label className="tc-label">{t("bio")}</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="tc-textarea"
        />
      </div>
      <div>
        <label className="tc-label">{t("seekingRole")}</label>
        <select
          value={form.seekingRole}
          onChange={(e) => setForm({ ...form, seekingRole: e.target.value })}
          className="tc-select"
        >
          <option value="">{tCommon("select")}</option>
          {FOUNDER_SEEKING_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="tc-label">{t("ideaStage")}</label>
        <select
          value={form.ideaStage}
          onChange={(e) => setForm({ ...form, ideaStage: e.target.value })}
          className="tc-select"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {tStages(s)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="tc-label">{t("commitment")}</label>
        <select
          value={form.commitmentLevel}
          onChange={(e) => setForm({ ...form, commitmentLevel: e.target.value })}
          className="tc-select"
        >
          <option value="Full-time">{t("fullTime")}</option>
          <option value="Part-time">{t("partTime")}</option>
        </select>
      </div>
      <div>
        <label className="tc-label">{t("skills")}</label>
        <p className="tc-hint">{t("skillsHint")}</p>
        <input
          type="text"
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          className="tc-input"
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
        <label className="tc-label">{t("languages")}</label>
        <input
          type="text"
          value={form.languages}
          onChange={(e) => setForm({ ...form, languages: e.target.value })}
          placeholder={t("languagesPh")}
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
      <button type="submit" disabled={loading} className="tc-btn-primary px-8 disabled:opacity-50">
        {loading ? t("saving") : profile ? t("updateProfile") : t("createProfile")}
      </button>
    </form>
  );
}
