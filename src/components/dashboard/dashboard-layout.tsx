import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NotificationsBell } from "./notifications-bell";
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
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      accountDisabled: true,
      country: true,
    },
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
    <div className="flex min-h-screen min-w-0 flex-col bg-gradient-to-br from-stone-100/80 via-stone-50 to-white lg:flex-row">
      <aside className="min-w-0 border-b border-stone-200/80 bg-white/95 p-3 shadow-tc-nav sm:p-4 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-stone-200/80 lg:p-6 lg:shadow-none">
        <Logo href={`/${locale}`} locale={locale} size="sm" className="mb-3 lg:mb-8" />
        <DashboardNav userRoles={roles} />
      </aside>
      <main className="min-h-screen min-w-0 flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6 lg:p-10">
        <div className="mb-6 flex min-w-0 flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-3 shadow-tc backdrop-blur-sm sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <h1 className="min-w-0 text-lg font-bold tracking-tight text-brand-green sm:text-xl md:text-2xl">
            {t("dashboard.title")}
          </h1>
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <NotificationsBell />
            <div className="max-w-[min(100%,280px)] rounded-lg bg-stone-50 px-3 py-2 text-right sm:text-left">
              {user.name?.trim() ? (
                <>
                  <p className="truncate text-sm font-semibold text-stone-800">{user.name.trim()}</p>
                  {user.email ? (
                    <p className="mt-0.5 truncate text-xs font-medium text-stone-500">{user.email}</p>
                  ) : null}
                </>
              ) : (
                <p className="truncate text-sm font-medium text-stone-600">{user.email}</p>
              )}
            </div>
            <Link
              href={`/${locale}`}
              className="text-sm font-semibold text-brand-teal transition hover:text-brand-green"
            >
              {t("dashboard.viewSite")}
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl min-w-0">{children}</div>
      </main>
    </div>
  );
}
