import { getRequestConfig } from "next-intl/server";
import { mergeMessages } from "./merge-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const en = (await import("../../messages/en.json")).default as Record<string, unknown>;
  const local = (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>;
  let messages = mergeMessages(en, local);

  if (locale !== routing.defaultLocale) {
    try {
      const layer = (await import(`../../messages/layers/${locale}.json`)).default as Record<string, unknown>;
      messages = mergeMessages(messages, layer);
    } catch {
      /* optional */
    }
  }

  return {
    locale,
    messages,
    timeZone: "Africa/Nairobi",
  };
});
