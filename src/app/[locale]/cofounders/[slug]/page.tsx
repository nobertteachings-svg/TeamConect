import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplyCoFounderButton } from "@/components/cofounder/apply-cofounder-button";
import { FormattedIdeaParagraph } from "@/components/cofounder/formatted-idea-paragraph";
import { authOptions } from "@/lib/auth-config";
import { canViewFullIdeaDetails } from "@/lib/idea-protection";
import { splitIdeaParagraphs, stripRedundantTitleFromBody } from "@/lib/idea-display";
import { formatStoredCountry } from "@/lib/countries";
import { getCoFounderSlotSnapshot } from "@/lib/team-slots";

export default async function StartupIdeaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tStages = await getTranslations({ locale, namespace: "startupStages" });
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;

  const idea = await prisma.startupIdea.findFirst({
    where: { slug, isPublic: true, deletedAt: null },
    include: {
      founder: {
        include: { user: { select: { id: true, name: true, country: true } } },
      },
    },
  });

  if (!idea) notFound();

  const founderCountry = formatStoredCountry(idea.founder.user?.country);
  const founderUserId = idea.founder.userId;
  const application = viewerId
    ? await prisma.coFounderApplication.findUnique({
        where: {
          ideaId_userId: { ideaId: idea.id, userId: viewerId },
        },
      })
    : null;

  const slotSnapshot = await getCoFounderSlotSnapshot(prisma, idea.id);
  const canApply =
    idea.status === "recruiting" &&
    Boolean(slotSnapshot && slotSnapshot.remaining > 0);

  const canSeeFull = canViewFullIdeaDetails({
    protectionMode: idea.protectionMode,
    founderUserId,
    viewerUserId: viewerId,
    hasApplication: !!application,
  });

  const isTeaserOnly = idea.protectionMode === "TEASER_ONLY";
  const teaserText =
    idea.publicTeaser?.trim() || t("ideaDetail.teaserFallback");

  const isOwner = Boolean(viewerId && viewerId === founderUserId);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-stone-200/80 bg-gradient-to-br from-stone-50 to-white">
          <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
            <Link
              href={`/${locale}/cofounders`}
              className="text-sm font-medium text-brand-teal hover:text-brand-green transition"
            >
              {t("ideaDetail.back")}
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-green text-balance">
              {idea.title}
            </h1>
            {isTeaserOnly && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
                {t("ideaDetail.protectedListing")}
              </span>
            )}
            {idea.status === "team_complete" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {t("ideaDetail.teamCompleteBadge")}
              </span>
            )}
          </div>
          <p className="text-stone-600 mt-2">
            {tCommon("by")}{" "}
            <span className="font-medium text-stone-800">
              {idea.founder.user?.name ?? tCommon("anonymous")}
            </span>
            {founderCountry ? (
              <>
                {" "}
                · <span className="text-stone-500">{founderCountry}</span>
              </>
            ) : null}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {idea.rolesNeeded.map((r) => (
              <span
                key={r}
                className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-medium text-brand-green"
              >
                {r}
              </span>
            ))}
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
              {tStages(idea.stage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED")}
            </span>
          </div>

          {isTeaserOnly && !canSeeFull && (
            <div className="mt-8 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-5 text-sm text-amber-950 shadow-sm">
              <p className="font-semibold text-amber-950">{t("ideaDetail.teaserOnlyTitle")}</p>
              <p className="mt-2 leading-relaxed text-amber-900/90">{t("ideaDetail.teaserOnlyBody")}</p>
            </div>
          )}

          <div className="mx-auto mt-10 max-w-2xl space-y-8">
            {canSeeFull ? (
              <>
                <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
                    {t("ideaDetail.description")}
                  </h2>
                  <div className="mt-5 space-y-5 text-[15px] text-stone-700 sm:text-base">
                    {descriptionParagraphs.map((para, i) => (
                      <FormattedIdeaParagraph key={i} text={para} />
                    ))}
                  </div>
                </section>
                {idea.pitch && pitchParagraphs.length > 0 ? (
                  <section className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-stone-50/80 to-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
                      {t("ideaDetail.pitch")}
                    </h2>
                    <div className="mt-5 space-y-5 text-[15px] text-stone-700 sm:text-base">
                      {pitchParagraphs.map((para, i) => (
                        <FormattedIdeaParagraph key={i} text={para} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
                  {t("ideaDetail.publicTeaser")}
                </h2>
                <div className="mt-5 text-[15px] text-stone-700 sm:text-base">
                  <FormattedIdeaParagraph text={teaserText} />
                </div>
              </section>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-stone-200">
            <ApplyCoFounderButton
              ideaId={idea.id}
              locale={locale}
              slug={slug}
              hasApplied={!!application}
              isOwner={isOwner}
              canApply={canApply}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
