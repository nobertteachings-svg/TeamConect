import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CoFounderApplicationActions } from "@/components/founder/cofounder-application-actions";

export default async function IdeaApplicantsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const idea = await prisma.startupIdea.findFirst({
    where: {
      id,
      founder: { userId: session.id },
    },
    include: {
      applications: {
        include: { user: { include: { founderProfile: true } } },
      },
      team: { select: { id: true } },
    },
  });

  if (!idea) notFound();

  const tTeams = await getTranslations({ locale, namespace: "teamWorkspace" });

  return (
    <div>
      <Link href={`/${locale}/dashboard/cofounders`} className="text-sm text-brand-green hover:underline mb-4 inline-block">
        {t("dashboardIdeaDetail.back")}
      </Link>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold">{idea.title}</h2>
        {idea.protectionMode === "TEASER_ONLY" && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
            {t("dashboardIdeaDetail.protectedBadge")}
          </span>
        )}
      </div>
      <div className="text-stone-700 mb-6 space-y-2">
        <p className="whitespace-pre-wrap">{idea.description}</p>
        {idea.pitch && <p className="whitespace-pre-wrap text-sm">{idea.pitch}</p>}
      </div>

      {idea.team && (
        <div className="mb-6 rounded-2xl border border-brand-teal/25 bg-gradient-to-br from-brand-teal/[0.07] to-white px-5 py-4">
          <p className="font-semibold text-brand-green">{tTeams("bannerTitle")}</p>
          <p className="mt-1 text-sm text-stone-600">{tTeams("bannerBody")}</p>
          <Link
            href={`/${locale}/dashboard/teams/${idea.team.id}`}
            className="mt-3 inline-block text-sm font-bold text-brand-teal hover:text-brand-green"
          >
            {tTeams("openWorkspace")} →
          </Link>
        </div>
      )}

      <h3 className="font-medium mb-4">
        {t("dashboardIdeaDetail.applicantsHeading", { count: idea.applications.length })}
      </h3>
      <div className="space-y-4">
        {idea.applications.map((app) => (
          <div key={app.id} className="p-4 rounded-lg border border-stone-200 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{app.user.name ?? tCommon("anonymous")}</p>
                <p className="text-sm text-stone-600">{app.user.email}</p>
                {app.message && <p className="text-sm mt-2">{app.message}</p>}
                {app.roleOffer && (
                  <p className="text-sm">
                    {t("dashboardIdeaDetail.rolePrefix")}: {app.roleOffer}
                  </p>
                )}
              </div>
              <CoFounderApplicationActions appId={app.id} status={app.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
