import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardNav } from "./dashboard-nav";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await getCurrentUser();
  if (!session?.id) {
    redirect(`/${locale}/sign-in?callbackUrl=/${locale}/dashboard`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, roles: true, accountDisabled: true, country: true },
  });

  if (!user) redirect(`/${locale}/sign-in`);
  if (user.accountDisabled) {
    redirect(`/${locale}/sign-in?error=AccountDisabled`);
  }

  if (!user.country?.trim()) {
    const back = `/${locale}/dashboard`;
    redirect(`/${locale}/complete-country?callbackUrl=${encodeURIComponent(back)}`);
  }

  const roles = user.roles.map((r) => r);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-stone-100/80 via-stone-50 to-white lg:flex-row">
      <aside className="border-b border-stone-200/80 bg-white/95 p-4 shadow-tc-nav lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-stone-200/80 lg:p-6 lg:shadow-none">
        <Logo href={`/${locale}`} locale={locale} size="sm" className="mb-8" />
        <DashboardNav userRoles={roles} />
      </aside>
      <main className="min-h-screen flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/90 px-5 py-4 shadow-tc backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold tracking-tight text-brand-green sm:text-2xl">{t("dashboard.title")}</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="max-w-[220px] truncate rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 sm:max-w-xs sm:text-sm">
              {user.email}
            </span>
            <Link
              href={`/${locale}`}
              className="text-sm font-semibold text-brand-teal transition hover:text-brand-green"
            >
              {t("dashboard.viewSite")}
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
