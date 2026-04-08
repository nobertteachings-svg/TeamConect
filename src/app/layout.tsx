import type { Viewport } from "next";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-url") || "";
  const isRtl = pathname.includes("/ar");
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const locale =
    firstSegment && routing.locales.includes(firstSegment as (typeof routing.locales)[number])
      ? firstSegment
      : routing.defaultLocale;

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
