"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/brand/logo";
import { LOCALE_LABELS } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

const PILLARS = ["cofounders", "community"] as const;
const LOCALES = routing.locales.map((code) => ({ code, label: LOCALE_LABELS[code] ?? code }));

const navLinkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100/90 hover:text-brand-green";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = (
    <>
      {PILLARS.map((pillar) => (
        <Link
          key={pillar}
          href={`/${locale}/${pillar}`}
          className={`${navLinkClass} py-2 sm:py-2`}
          onClick={() => setMobileMenuOpen(false)}
        >
          {t(pillar)}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 pt-[env(safe-area-inset-top)] shadow-sm shadow-stone-900/[0.04] backdrop-blur-md backdrop-saturate-150">
      <div className="container mx-auto max-w-[100vw] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]">
        <div className="flex min-h-[3.75rem] items-center justify-between gap-3 xs:min-h-[4rem] sm:min-h-[4.25rem]">
          <Logo href={`/${locale}`} locale={locale} size="md" className="min-w-0 shrink" />

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks}
            <select
              className="ml-2 cursor-pointer rounded-lg border border-stone-200/90 bg-stone-50/80 px-2.5 py-2 text-sm text-stone-700 shadow-sm transition hover:border-stone-300 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/25"
              value={locale}
              onChange={(e) => {
                window.location.href = `/${e.target.value}`;
              }}
              aria-label="Select language"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {session ? (
              <Link
                href={`/${locale}/dashboard`}
                className="ml-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/10"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href={`/${locale}/sign-in`} className={`${navLinkClass} ml-1`}>
                  {t("signIn")}
                </Link>
                <Link
                  href={`/${locale}/sign-up`}
                  className="ml-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-green/20 transition hover:bg-brand-green-hover"
                >
                  {t("getStarted")}
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="rounded-xl p-2.5 text-stone-600 transition hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav
            className="flex flex-col gap-1 border-t border-stone-200/80 py-4 lg:hidden"
            aria-label="Mobile navigation"
          >
            {navLinks}
            <select
              className="mt-1 w-full max-w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm shadow-sm sm:max-w-[12rem]"
              value={locale}
              onChange={(e) => {
                window.location.href = `/${e.target.value}`;
              }}
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {session ? (
              <Link
                href={`/${locale}/dashboard`}
                className="rounded-lg py-2.5 text-sm font-semibold text-brand-green"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/${locale}/sign-in`}
                  className="rounded-lg py-2.5 text-sm font-medium text-stone-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("signIn")}
                </Link>
                <Link
                  href={`/${locale}/sign-up`}
                  className="rounded-xl bg-brand-green px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-brand-green/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("getStarted")}
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
