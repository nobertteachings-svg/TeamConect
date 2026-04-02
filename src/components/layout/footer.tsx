"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";

const PILLARS = ["cofounders", "community"] as const;

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const tLanding = useTranslations("landing.pillars");
  const tCommon = useTranslations("common");

  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-gradient-to-b from-white via-stone-50/50 to-stone-100/40">
      <div className="container mx-auto px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
          <div className="md:col-span-2">
            <Logo href={`/${locale}`} locale={locale} size="lg" className="mb-5" />
            <p className="max-w-md text-sm leading-relaxed text-stone-600">{t("blurb")}</p>
            <p className="mt-3 text-sm font-semibold tracking-wide text-brand-gold">{t("tagline")}</p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-green/90">{t("platform")}</h4>
            <ul className="space-y-2.5">
              {PILLARS.map((pillar) => (
                <li key={pillar}>
                  <Link
                    href={`/${locale}/${pillar}`}
                    className="text-sm text-stone-600 transition hover:text-brand-green"
                  >
                    {tLanding(`${pillar}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-brand-green/90">{t("connect")}</h4>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li>
                <Link href={`/${locale}/sign-in`} className="transition hover:text-brand-green">
                  {tCommon("signIn")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sign-up`} className="transition hover:text-brand-green">
                  {tCommon("getStarted")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-stone-200/70 pt-8 sm:flex-row">
          <p className="text-center text-sm text-stone-500 sm:text-start">{t("copyright", { year: new Date().getFullYear() })}</p>
          <p className="text-sm font-medium text-brand-gold">{t("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
