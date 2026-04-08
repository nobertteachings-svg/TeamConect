"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "overview" as const },
  { href: "/dashboard/cofounders", labelKey: "cofounders" as const },
  { href: "/dashboard/teams", labelKey: "teams" as const },
  { href: "/dashboard/admin", labelKey: "admin" as const, roles: ["ADMIN"] },
] as const;

export function DashboardNav({ userRoles }: { userRoles?: string[] }) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboardNav");

  const items = NAV_ITEMS.filter((item) => {
    if ("roles" in item && item.roles) {
      return item.roles.some((r) => userRoles?.includes(r));
    }
    return true;
  });

  return (
    <nav
      className="flex flex-row gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      aria-label="Dashboard"
    >
      {items.map((item) => {
        const href = `/${locale}${item.href}`;
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={item.href}
            href={href}
            className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:shrink lg:whitespace-normal ${
              isActive
                ? "bg-gradient-to-r from-brand-green/12 to-brand-teal/[0.06] text-brand-green shadow-sm ring-1 ring-brand-green/15"
                : "text-stone-600 hover:bg-stone-100/90 hover:text-stone-900"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
