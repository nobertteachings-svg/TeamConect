import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function TeamsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teamWorkspace" });
  const session = await getCurrentUser();
  if (!session?.id) return null;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.id },
    include: {
      team: {
        include: {
          idea: { select: { title: true, slug: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { team: { updatedAt: "desc" } },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-brand-green sm:text-2xl">{t("pageTitle")}</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-stone-600">{t("pageLead")}</p>

      {memberships.length === 0 ? (
        <div className="tc-card p-8 text-center text-stone-600">
          <p>{t("empty")}</p>
          <p className="mt-3 text-sm">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {memberships.map((m) => (
            <li key={m.team.id}>
              <Link
                href={`/${locale}/dashboard/teams/${m.team.id}`}
                className="tc-card block p-5 transition hover:border-brand-teal/30 hover:shadow-tc-md"
              >
                <p className="font-semibold text-brand-green">{m.team.idea.title}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {m.role === "FOUNDER" ? t("roleFounder") : t("roleMember")} ·{" "}
                  {t("memberCount", { count: m.team._count.members })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
