"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { LandingStats } from "@/lib/landing-stats";

const POLL_MS = 45_000;

type Props = {
  initial: LandingStats;
  locale: string;
};

export function LandingLiveStats({ initial, locale }: Props) {
  const t = useTranslations("landing");
  const [stats, setStats] = useState<LandingStats>(initial);

  const nf = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    } catch {
      return new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
    }
  }, [locale]);

  useEffect(() => {
    const ac = new AbortController();

    async function pull() {
      try {
        const res = await fetch("/api/public/landing-stats", {
          signal: ac.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as LandingStats;
        if (
          typeof data.activeIdeas === "number" &&
          typeof data.foundersJoined === "number" &&
          typeof data.teamsFormed === "number" &&
          typeof data.countriesRepresented === "number"
        ) {
          setStats(data);
        }
      } catch {
        /* ignore abort / network */
      }
    }

    void pull();
    const id = setInterval(pull, POLL_MS);
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);

  const items = [
    { value: stats.activeIdeas, label: t("liveStatActiveIdeas") },
    { value: stats.foundersJoined, label: t("liveStatFounders") },
    { value: stats.teamsFormed, label: t("liveStatTeams") },
    { value: stats.countriesRepresented, label: t("liveStatCountries") },
  ] as const;

  return (
    <div className="mx-auto mt-10 max-w-3xl min-w-0 lg:mx-0" aria-live="polite">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80 lg:text-start">
        {t("liveStatsHeading")}
      </p>
      <dl className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        {items.map(({ value, label }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2.5 text-center backdrop-blur-sm sm:px-4 sm:py-4 lg:text-start"
          >
            <dt className="text-[11px] font-medium leading-snug text-sky-200/85 sm:text-xs">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">{nf.format(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-center text-[11px] text-sky-300/70 lg:text-start">{t("liveStatsHint")}</p>
    </div>
  );
}
