"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { CountrySelect } from "@/components/forms/country-select";

const ROLES = ["founder_with_idea", "developer", "designer", "investor_mentor"] as const;

type WaitlistFormProps = {
  /** Wider stacked layout for the home waitlist band */
  variant?: "default" | "landing";
};

export function WaitlistForm({ variant = "default" }: WaitlistFormProps) {
  const t = useTranslations("waitlist");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: role || undefined,
          country: country || undefined,
          language: locale,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setRole("");
        setCountry("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-brand-green font-medium text-lg text-center sm:text-start">{t("success")}</p>
    );
  }

  const isLanding = variant === "landing";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isLanding
          ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
          : "flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
      }
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        required
        className={
          isLanding
            ? "tc-input sm:col-span-2 bg-stone-50/60 py-3.5"
            : "tc-input min-w-0 flex-1"
        }
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className={isLanding ? "tc-select py-3.5" : "tc-select"}
      >
        <option value="">{t("rolePlaceholder")}</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <CountrySelect
        value={country}
        onChange={setCountry}
        placeholder={t("countryPlaceholder")}
        className={isLanding ? "tc-select py-3.5" : "tc-select"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={
          isLanding
            ? "tc-btn-primary sm:col-span-2 w-full bg-gradient-to-r from-brand-green to-[#003a6f] py-3.5 shadow-brand-green/25 hover:from-[#003a6f] hover:to-brand-green"
            : "tc-btn-primary shrink-0"
        }
      >
        {status === "loading" ? "…" : t("submit")}
      </button>
    </form>
  );
}
