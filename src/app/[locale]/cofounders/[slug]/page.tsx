import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ApplyCoFounderButton } from "@/components/cofounder/apply-cofounder-button";
import { IdeaDetailFormView } from "@/components/cofounder/idea-detail-form-view";
import { authOptions } from "@/lib/auth-config";
import { canViewFullIdeaDetails } from "@/lib/idea-protection";
import { getCoFounderSlotSnapshot } from "@/lib/team-slots";

export default async function StartupIdeaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
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
  const isOwner = Boolean(viewerId && viewerId === founderUserId);

  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <Header />
      <main className="flex-1">
        <div className="border-b border-stone-200/80 bg-gradient-to-br from-stone-50 to-white">
          <div className="container mx-auto max-w-5xl px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
            <Link
              href={`/${locale}/cofounders`}
              className="text-sm font-medium text-brand-teal transition hover:text-brand-green"
            >
              {t("ideaDetail.back")}
            </Link>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
          <IdeaDetailFormView
            locale={locale}
            title={idea.title}
            protectionMode={idea.protectionMode}
            publicTeaser={idea.publicTeaser}
            description={idea.description}
            pitch={idea.pitch}
            canSeeFull={canSeeFull}
            isTeaserOnly={isTeaserOnly}
            teaserFallback={t("ideaDetail.teaserFallback")}
            rolesNeeded={idea.rolesNeeded}
            coFounderSlotsWanted={idea.coFounderSlotsWanted}
            filledMemberSlots={slotSnapshot?.filled ?? 0}
            remainingSlots={slotSnapshot?.remaining ?? 0}
            isRecruiting={idea.status === "recruiting"}
            industries={idea.industries}
            ideaCountryCode={idea.country}
            stage={idea.stage as "IDEA" | "VALIDATING" | "BUILDING" | "LAUNCHED" | "FUNDED"}
            founderName={idea.founder.user?.name ?? null}
            founderCountryCode={idea.founder.user?.country ?? null}
            anonymousLabel={tCommon("anonymous")}
            showTeamCompleteBadge={idea.status === "team_complete"}
          />

          <div className="mx-auto mt-12 max-w-5xl border-t border-stone-200 pt-10">
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
