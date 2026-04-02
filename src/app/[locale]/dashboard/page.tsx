import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      founderProfile: { include: { ideas: true } },
      coFounderApplications: true,
    },
  });

  if (!user) return null;

  const stats = {
    ideasPosted: user.founderProfile?.ideas?.length ?? 0,
    cofounderApplicationsSent: user.coFounderApplications.length,
  };

  const welcome = user.name
    ? t("dashboard.welcome", { name: user.name })
    : t("dashboard.welcomeThere");

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-semibold tracking-tight text-stone-800 sm:text-2xl">{welcome}</h2>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="tc-card p-6 transition hover:shadow-tc-md">
          <p className="text-sm font-medium text-stone-500">{t("dashboard.statsIdeas")}</p>
          <p className="mt-2 bg-gradient-to-br from-brand-green to-brand-teal bg-clip-text text-3xl font-bold text-transparent tabular-nums">
            {stats.ideasPosted}
          </p>
          <Link
            href={`/${locale}/dashboard/cofounders`}
            className="mt-4 inline-flex text-sm font-semibold text-brand-teal transition hover:text-brand-green"
          >
            {t("dashboard.manageIdeas")}
          </Link>
        </div>
        <div className="tc-card p-6 transition hover:shadow-tc-md">
          <p className="text-sm font-medium text-stone-500">{t("dashboard.statsApplications")}</p>
          <p className="mt-2 bg-gradient-to-br from-brand-green to-brand-teal bg-clip-text text-3xl font-bold text-transparent tabular-nums">
            {stats.cofounderApplicationsSent}
          </p>
          <Link
            href={`/${locale}/dashboard/cofounders`}
            className="mt-4 inline-flex text-sm font-semibold text-brand-teal transition hover:text-brand-green"
          >
            {t("dashboard.viewDashboard")}
          </Link>
        </div>
      </div>

      <div className="tc-card p-6 sm:p-8">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-stone-500">{t("dashboard.quickActions")}</h3>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${locale}/dashboard/cofounders`} className="tc-btn-primary">
            {user.founderProfile ? t("dashboard.manageProfileIdeas") : t("dashboard.createProfile")}
          </Link>
          <Link href={`/${locale}/cofounders`} className="tc-btn-secondary">
            {t("dashboard.browseIdeas")}
          </Link>
          <Link href={`/${locale}/community`} className="tc-btn-secondary">
            {tCommon("community")}
          </Link>
        </div>
      </div>
    </div>
  );
}
