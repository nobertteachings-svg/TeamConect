import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCachedIdeas } from "@/lib/cached-data";
import { COUNTRY_FILTER_CHIP_CODES, formatStoredCountry } from "@/lib/countries";
import { publicListingBlurb } from "@/lib/idea-protection";
import { COFOUNDER_ROLE_OPTIONS } from "@/lib/cofounder-roles";

const STAGES = ["IDEA", "VALIDATING", "BUILDING", "LAUNCHED", "FUNDED"];

export const revalidate = 60;

export default async function CoFoundersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string; stage?: string; role?: string; cursor?: string }>;
}) {
  const { locale } = await params;
  const { country, stage, role, cursor } = await searchParams;
  const t = await getTranslations({ locale, namespace: "cofoundersPage" });
  const tStages = await getTranslations({ locale, namespace: "startupStages" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const { ideas, nextCursor } = await getCachedIdeas(
    { country, stage, role },
    cursor ?? null
  );

  const hasFilters = Boolean(country || stage || role || cursor);

  function mergeFilters(overrides: {
    country?: string | null;
    stage?: string | null;
    role?: string | null;
  }) {
    const c = overrides.country !== undefined ? overrides.country : country;
    const s = overrides.stage !== undefined ? overrides.stage : stage;
    const r = overrides.role !== undefined ? overrides.role : role;
    const next = new URLSearchParams();
    if (c) next.set("country", c);
    if (s) next.set("stage", s);
    if (r) next.set("role", r);
    const q = next.toString();
    return q ? `/${locale}/cofounders?${q}` : `/${locale}/cofounders`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-stone-200/80 bg-gradient-to-br from-white via-stone-50/90 to-brand-teal/[0.06]">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-brand-green sm:text-4xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-3 text-lg text-stone-600 max-w-2xl leading-relaxed">{t("heroLead")}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-stone-700">{t("filterLabel")}</span>
            {hasFilters && (
              <Link
                href={`/${locale}/cofounders`}
                className="text-sm font-medium text-brand-teal hover:text-brand-green underline-offset-2 hover:underline"
              >
                {t("clearFilters")}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {COUNTRY_FILTER_CHIP_CODES.map((c) => (
              <Link
                key={c}
                href={mergeFilters({ country: country === c ? null : c })}
                scroll={false}
                className={country === c ? "tc-chip-active" : "tc-chip"}
              >
                {formatStoredCountry(c)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {STAGES.map((s) => (
              <Link
                key={s}
                href={mergeFilters({ stage: stage === s ? null : s })}
                scroll={false}
                className={stage === s ? "tc-chip-active" : "tc-chip"}
              >
                {tStages(s)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-10">
            {COFOUNDER_ROLE_OPTIONS.map((r) => (
              <Link
                key={r}
                href={mergeFilters({ role: role === r ? null : r })}
                scroll={false}
                className={role === r ? "tc-chip-active" : "tc-chip"}
              >
                {r}
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {ideas.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/90 p-12 text-center shadow-inner sm:p-16">
                <p className="font-medium text-stone-800 text-lg">{t("emptyTitle")}</p>
                <p className="text-stone-600 mt-2 max-w-md mx-auto leading-relaxed">{t("emptyLead")}</p>
              </div>
            ) : (
              ideas.map((idea) => {
                const founderCountry = formatStoredCountry(idea.founder.user?.country ?? null);
                return (
                <Link
                  key={idea.id}
                  href={`/${locale}/cofounders/${idea.slug}`}
                  className="group tc-card block p-6 transition duration-200 hover:-translate-y-0.5 hover:border-brand-teal/30 hover:shadow-tc-md sm:p-7"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-lg text-brand-green group-hover:text-brand-teal transition-colors">
                      {idea.title}
                    </h2>
                    {idea.protectionMode === "TEASER_ONLY" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
                        {t("protectedBadge")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                    {publicListingBlurb({
                      protectionMode: idea.protectionMode,
                      publicTeaser: idea.publicTeaser,
                      description: idea.description,
                      title: idea.title,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {idea.rolesNeeded.slice(0, 4).map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-4 pt-4 border-t border-stone-100">
                    {tCommon("by")} {idea.founder.user?.name ?? tCommon("anonymous")}
                    {founderCountry ? ` · ${founderCountry}` : ""}
                    {" · "}
                    {tStages(idea.stage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED")}
                  </p>
                </Link>
              );
              })
            )}
          </div>
          {nextCursor && (
            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/cofounders?${new URLSearchParams({
                  ...(country && { country }),
                  ...(stage && { stage }),
                  ...(role && { role }),
                  cursor: nextCursor,
                }).toString()}`}
                className="tc-btn-primary px-8 py-3.5 text-base"
              >
                {t("loadMore")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
