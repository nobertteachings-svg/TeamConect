import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCachedIdeas } from "@/lib/cached-data";
import { COUNTRY_FILTER_CHIP_CODES, formatStoredCountry } from "@/lib/countries";
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
    <div className="flex min-h-screen min-w-0 flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-stone-200/80 bg-gradient-to-br from-white via-stone-50/90 to-brand-teal/[0.06]">
          <div className="container mx-auto max-w-6xl px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-brand-green sm:text-3xl md:text-4xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">{t("heroLead")}</p>
            <p className="mt-2 max-w-2xl text-sm text-stone-500">{t("listHint")}</p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-stone-700">{t("filterLabel")}</span>
            {hasFilters && (
              <Link
                href={`/${locale}/cofounders`}
                className="text-sm font-medium text-brand-teal underline-offset-2 hover:text-brand-green hover:underline"
              >
                {t("clearFilters")}
              </Link>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
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
          <div className="mb-4 flex flex-wrap gap-2">
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
          <div className="mb-10 flex flex-wrap gap-2">
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

          <div className="mx-auto max-w-2xl">
            {ideas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/90 p-12 text-center shadow-inner sm:p-16">
                <p className="text-lg font-medium text-stone-800">{t("emptyTitle")}</p>
                <p className="mx-auto mt-2 max-w-md leading-relaxed text-stone-600">{t("emptyLead")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                {ideas.map((idea) => (
                  <li key={idea.id}>
                    <Link
                      href={`/${locale}/cofounders/${idea.slug}`}
                      className="group block min-w-0 px-4 py-4 transition hover:bg-stone-50/90 sm:px-5 sm:py-4"
                      aria-label={t("openIdeaAria", { title: idea.title })}
                    >
                      <span className="font-semibold text-brand-green group-hover:text-brand-teal">
                        {idea.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
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
