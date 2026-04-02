import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr", "ar", "es", "de", "it", "pt", "ru", "zh", "ja", "uk", "ko", "el"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});
