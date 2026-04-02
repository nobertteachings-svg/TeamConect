import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FounderProfileForm } from "@/components/founder/founder-profile-form";
import { StartupIdeaForm } from "@/components/founder/startup-idea-form";

export default async function CoFoundersDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tTeams = await getTranslations({ locale, namespace: "teamWorkspace" });
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const founderProfile = await prisma.founderProfile.findUnique({
    where: { userId: session.id },
    include: {
      ideas: {
        include: {
          _count: { select: { applications: true } },
          team: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const applications = await prisma.coFounderApplication.findMany({
    where: { userId: session.id },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          slug: true,
          team: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">{t("dashboardCofounders.pageTitle")}</h2>
      <div className="tc-card p-5 sm:p-7">
        <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-stone-500">{t("dashboardCofounders.founderProfile")}</h3>
        <FounderProfileForm profile={founderProfile} userId={session.id} />
      </div>
      {founderProfile && (
        <>
          <div className="tc-card p-5 sm:p-7">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-stone-500">{t("dashboardCofounders.postNewIdea")}</h3>
            <StartupIdeaForm founderId={founderProfile.id} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-500">{t("dashboardCofounders.myIdeas")}</h3>
            {founderProfile.ideas.length === 0 ? (
              <p className="text-stone-600">{t("dashboardCofounders.noIdeas")}</p>
            ) : (
              <div className="space-y-2">
                {founderProfile.ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="tc-card p-4 transition hover:border-brand-teal/25 hover:shadow-tc-md"
                  >
                    <Link href={`/${locale}/dashboard/cofounders/${idea.id}`} className="block">
                      <p className="font-medium flex flex-wrap items-center gap-2">
                        {idea.title}
                        {idea.protectionMode === "TEASER_ONLY" && (
                          <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            {tCommon("protected")}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-stone-600">
                        {idea.status} — {t("dashboardCofounders.applicants", { count: idea._count.applications })}
                      </p>
                    </Link>
                    {idea.team && (
                      <Link
                        href={`/${locale}/dashboard/teams/${idea.team.id}`}
                        className="mt-3 inline-block text-sm font-semibold text-brand-teal hover:text-brand-green"
                      >
                        {tTeams("openWorkspace")} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <div>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-stone-500">{t("dashboardCofounders.myApplications")}</h3>
        {applications.length === 0 ? (
          <p className="text-stone-600">{t("dashboardCofounders.noApplications")}</p>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="tc-card p-4 transition hover:shadow-tc">
                <Link href={`/${locale}/cofounders/${app.idea.slug}`} className="font-semibold text-brand-green hover:text-brand-teal">
                  {app.idea.title}
                </Link>
                <p className="text-sm text-stone-600">
                  {t("dashboardCofounders.status")}: {app.status}
                </p>
                {app.status === "accepted" && app.idea.team && (
                  <Link
                    href={`/${locale}/dashboard/teams/${app.idea.team.id}`}
                    className="mt-2 inline-block text-sm font-semibold text-brand-teal hover:text-brand-green"
                  >
                    {tTeams("openWorkspace")} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
