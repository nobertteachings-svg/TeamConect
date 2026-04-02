import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { LandingLiveStats } from "@/components/landing/landing-live-stats";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { getLandingStats } from "@/lib/landing-stats";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const PILLARS = ["cofounders", "community"] as const;

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersThreeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarSparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12l1.5 1.5L16 11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const PILLAR_ICONS = {
  cofounders: UsersThreeIcon,
  community: CalendarSparkIcon,
} as const;

export default async function HomePage() {
  const t = await getTranslations("landing");
  const tCommon = await getTranslations("common");
  const tWaitlist = await getTranslations("waitlist");
  const locale = await getLocale();
  const landingStats = await getLandingStats();

  const headline = t("headline");
  const headlineDot = headline.indexOf(".");
  const headlinePrimary = headlineDot >= 0 ? headline.slice(0, headlineDot + 1).trim() : headline;
  const headlineAccent = headlineDot >= 0 ? headline.slice(headlineDot + 1).trim() : "";

  const differentiators = [
    { Icon: ShieldIcon, title: t("whyProtectTitle"), desc: t("whyProtectDesc") },
    { Icon: ChatCheckIcon, title: t("whyApplicationTitle"), desc: t("whyApplicationDesc") },
    { Icon: GlobeIcon, title: t("whyLanguagesTitle"), desc: t("whyLanguagesDesc") },
  ] as const;

  const heroStats = [
    t("heroStatLanguages"),
    t("heroStatProtected"),
    t("heroStatApply"),
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden text-white">
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#021c3a] via-[#043566] to-[#004a8d]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand-teal/25 blur-3xl motion-reduce:animate-none animate-landing-blob"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-brand-gold/20 blur-3xl motion-reduce:animate-none animate-landing-blob-slow"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]"
            aria-hidden
          />
          <div className="relative container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-12">
              <div className="text-center lg:text-start">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/95">
                  {t("tagline")}
                </p>
                <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-br from-white via-white to-white/75 bg-clip-text text-transparent">
                    {headlinePrimary}
                  </span>
                  {headlineAccent ? (
                    <span className="mt-1 block bg-gradient-to-r from-brand-gold via-amber-200 to-brand-teal bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none animate-landing-shimmer">
                      {headlineAccent}
                    </span>
                  ) : null}
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-sky-100/90 lg:mx-0 sm:text-lg">
                  {t("subheadline")}
                </p>

                <LandingLiveStats initial={landingStats} locale={locale} />

                <ul className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2 sm:gap-3 lg:mx-0 lg:justify-start">
                  {heroStats.map((label) => (
                    <li
                      key={label}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-sky-100/95 backdrop-blur-sm sm:text-sm"
                    >
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                  <Link
                    href={`/${locale}/cofounders`}
                    className="inline-flex justify-center rounded-xl bg-brand-gold px-7 py-3.5 text-center text-sm font-semibold text-[#1a0f00] shadow-lg shadow-brand-gold/25 transition hover:bg-brand-gold-hover hover:text-white"
                  >
                    {t("exploreCta")}
                  </Link>
                  <Link
                    href={`/${locale}/sign-up`}
                    className="inline-flex justify-center rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
                  >
                    {tCommon("getStarted")}
                  </Link>
                  <a
                    href="#waitlist"
                    className="inline-flex justify-center rounded-xl px-5 py-3.5 text-center text-sm font-medium text-sky-200/90 underline-offset-4 hover:text-white hover:underline sm:px-4"
                  >
                    {t("secondaryCta")}
                  </a>
                </div>
                <p className="mx-auto mt-4 max-w-md text-sm text-sky-200/80 lg:mx-0">{t("exploreLead")}</p>
              </div>

              {/* Product preview card */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-teal/30 to-brand-gold/20 opacity-60 blur-2xl motion-reduce:opacity-40"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-1 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <div className="rounded-[0.9rem] bg-[#0a2744]/90 p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/90">
                        {t("heroPreviewLabel")}
                      </span>
                      <span className="rounded-md bg-brand-gold/20 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                        {t("heroPreviewApplicants")}
                      </span>
                    </div>
                    <p className="text-lg font-semibold leading-snug text-white sm:text-xl">{t("heroPreviewTitle")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-sky-200/85">{t("heroPreviewTeaser")}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-sky-100">
                        {t("whyProtectTitle")}
                      </span>
                      <span className="rounded-lg bg-brand-teal/25 px-2.5 py-1 text-xs font-medium text-sky-100">
                        {t("heroPreviewRemote")}
                      </span>
                    </div>
                    <p className="mt-4 border-t border-white/10 pt-4 text-xs text-sky-300/80">{t("heroPreviewMeta")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
        </section>

        {/* Waitlist */}
        <section
          id="waitlist"
          className="relative scroll-mt-24 border-b border-stone-200/80 bg-gradient-to-b from-white via-stone-50 to-white py-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#004a8d]/[0.06] to-transparent" aria-hidden />
          <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-brand-green sm:text-3xl">{tWaitlist("title")}</h2>
              <p className="mx-auto mt-3 max-w-lg text-stone-600">{t("waitlistSectionLead")}</p>
            </div>
            <div className="mt-10 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xl shadow-stone-200/50 sm:p-8">
              <WaitlistForm variant="landing" />
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-green mb-3 tracking-tight">{t("whyTitle")}</h2>
              <p className="text-stone-600 leading-relaxed">{t("whySubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
              {differentiators.map(({ Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/80 p-6 sm:p-8 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-teal/30 hover:shadow-lg ${
                    i === 0 ? "md:row-span-1" : ""
                  }`}
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-teal/[0.07] blur-2xl transition group-hover:bg-brand-teal/15"
                    aria-hidden
                  />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal/15 to-brand-teal/5 text-brand-teal ring-1 ring-brand-teal/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="relative mt-5 text-lg font-semibold text-brand-green">{title}</h3>
                  <p className="relative mt-2 text-stone-600 text-sm sm:text-base leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-100/90 via-stone-50 to-white">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-brand-green mb-10 sm:mb-14 tracking-tight">
              {t("pillarSectionTitle")}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              {PILLARS.map((pillar) => {
                const Icon = PILLAR_ICONS[pillar];
                return (
                  <Link
                    key={pillar}
                    href={`/${locale}/${pillar}`}
                    className="group relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-md transition duration-300 hover:border-brand-teal/35 hover:shadow-2xl hover:shadow-brand-teal/10"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-brand-green/[0.03] via-transparent to-brand-gold/[0.06] opacity-0 transition group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-[#003a6f] text-white shadow-lg shadow-brand-green/25 transition group-hover:scale-105 group-hover:shadow-brand-gold/20">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-semibold text-lg text-brand-green group-hover:text-brand-teal transition-colors">
                          {t(`pillars.${pillar}.title`)}
                        </h3>
                        <p className="mt-2 text-stone-600 text-sm sm:text-base leading-relaxed">
                          {t(`pillars.${pillar}.desc`)}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-teal">
                          {tCommon("learnMore")}
                          <span aria-hidden className="transition group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
