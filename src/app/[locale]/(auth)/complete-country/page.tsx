import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { CompleteCountryForm } from "./complete-country-form";

export default async function CompleteCountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  const defaultCallback = `/${locale}/dashboard`;

  if (!session?.user?.id) {
    const q = new URLSearchParams({
      callbackUrl: sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : defaultCallback,
    });
    redirect(`/${locale}/sign-in?${q.toString()}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { country: true },
  });

  if (user?.country?.trim()) {
    const cb = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : defaultCallback;
    redirect(cb);
  }

  const t = await getTranslations({ locale, namespace: "auth" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-stone-100/80 via-white to-stone-50 px-4 py-14 sm:py-20">
      <Logo href={`/${locale}`} locale={locale} size="lg" className="mb-10 drop-shadow-sm" />
      <div className="w-full max-w-md tc-card p-8 shadow-tc-md sm:p-10">
        <h1 className="mb-3 text-center text-2xl font-bold tracking-tight text-brand-green sm:text-[1.65rem]">
          {t("completeCountryTitle")}
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed text-stone-600">{t("completeCountryLead")}</p>
        <Suspense fallback={<p className="text-center text-stone-500">{tCommon("loading")}</p>}>
          <CompleteCountryForm locale={locale} defaultCallback={defaultCallback} />
        </Suspense>
      </div>
    </div>
  );
}
