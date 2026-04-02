"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CountrySelect } from "@/components/forms/country-select";

export function CompleteCountryForm({
  locale,
  defaultCallback,
}: {
  locale: string;
  defaultCallback: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") ? rawCallback : defaultCallback;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!country) {
      setError(t("countryRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/country", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? t("otpFailed"));
        return;
      }
      await update();
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="country" className="tc-label">
          {t("countryLabel")}
        </label>
        <CountrySelect
          id="country"
          value={country}
          onChange={setCountry}
          placeholder={t("countryPlaceholder")}
          className="tc-select mt-1.5 w-full"
          required
          disabled={loading}
        />
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className="tc-btn-primary w-full py-3.5 disabled:opacity-50">
        {loading ? t("otpVerifying") : t("continue")}
      </button>
      <p className="text-center text-sm text-stone-500">
        <a href={`/${locale}/sign-in`} className="font-semibold text-brand-teal hover:text-brand-green">
          {t("backSignIn")}
        </a>
      </p>
    </form>
  );
}
