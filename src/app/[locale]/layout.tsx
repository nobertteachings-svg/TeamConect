import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OG_LOCALE_TAGS } from "@/i18n/locales";
import { routing } from "@/i18n/routing";
import { Providers } from "@/app/providers";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://teamconect.com";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const title = t("seo.title");
  const description = t("seo.description");
  const url = `${BASE_URL}/${locale}`;
  const ogLocale = OG_LOCALE_TAGS[locale] ?? locale;
  const ogAlternates = routing.locales
    .filter((l) => l !== locale)
    .map((l) => OG_LOCALE_TAGS[l] ?? l);

  return {
    title: { default: title, template: "%s | TeamConect" },
    description,
    keywords: [
      "co-founder matching",
      "find a co-founder",
      "startup co-founder",
      "business co-founder",
      "non-technical founder",
      "founder community",
      "startup ideas",
    ],
    authors: [{ name: "TeamConect" }],
    creator: "TeamConect",
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternates,
      url,
      siteName: "TeamConect",
      title,
      description,
      images: [
        {
          url: `${BASE_URL}/logo.png`,
          width: 1536,
          height: 1024,
          alt: "TeamConect",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [OG_LOCALE_TAGS[l] ?? l, `${BASE_URL}/${l}`])
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Africa/Nairobi"
    >
      <Providers>
        <div
          className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-stone-100/70 text-stone-900 antialiased"
          lang={locale}
          dir={isRtl ? "rtl" : "ltr"}
        >
          {children}
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
