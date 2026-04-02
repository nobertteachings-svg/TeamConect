import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplyCoFounderButton } from "@/components/cofounder/apply-cofounder-button";
import { authOptions } from "@/lib/auth-config";
import { canViewFullIdeaDetails } from "@/lib/idea-protection";
import { formatStoredCountry } from "@/lib/countries";

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
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-green tracking-tight text-balance">
              {idea.title}
            </h1>
            {isTeaserOnly && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
                {t("ideaDetail.protectedListing")}
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
          <div className="flex flex-wrap gap-2 mt-5">
            {idea.rolesNeeded.map((r) => (
              <span
                key={r}
                className="px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-sm font-medium"
              >
                {r}
              </span>
            ))}
            <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm">
              {tStages(idea.stage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED")}
            </span>
          </div>

          {isTeaserOnly && !canSeeFull && (
            <div className="mt-8 p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white text-sm text-amber-950 shadow-sm">
              <p className="font-semibold text-amber-950">{t("ideaDetail.teaserOnlyTitle")}</p>
              <p className="mt-2 text-amber-900/90 leading-relaxed">{t("ideaDetail.teaserOnlyBody")}</p>
            </div>
          )}

          <div className="mt-10 prose prose-stone prose-lg max-w-none">
            {canSeeFull ? (
              <>
                <h2 className="text-lg font-semibold text-brand-green not-prose mb-3">{t("ideaDetail.description")}</h2>
                <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{idea.description}</p>
                {idea.pitch && (
                  <>
                    <h2 className="text-lg font-semibold text-brand-green not-prose mt-8 mb-3">{t("ideaDetail.pitch")}</h2>
                    <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{idea.pitch}</p>
                  </>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-brand-green not-prose mb-3">{t("ideaDetail.publicTeaser")}</h2>
                <p className="whitespace-pre-wrap text-stone-700 leading-relaxed">{teaserText}</p>
              </>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-stone-200">
            <ApplyCoFounderButton
              ideaId={idea.id}
              locale={locale}
              slug={slug}
              hasApplied={!!application}
              isOwner={isOwner}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
