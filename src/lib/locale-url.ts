import { routing } from "@/i18n/routing";

/** Pick a valid URL locale segment from User.preferredLang (defaults to en). */
export function localeForUser(preferredLang: string | null | undefined): string {
  const p = preferredLang?.trim().toLowerCase();
  if (p && (routing.locales as readonly string[]).includes(p)) return p;
  return routing.defaultLocale;
}
