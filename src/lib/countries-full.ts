import countries, { type LocaleData } from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale as LocaleData);

export type CountryOption = { code: string; label: string };

function buildAllCountryOptions(): CountryOption[] {
  const names = countries.getNames("en", { select: "official" });
  return Object.entries(names)
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Sorted ISO2 + English official name (for selects). */
export const ALL_COUNTRY_OPTIONS: CountryOption[] = buildAllCountryOptions();

const CODE_SET = new Set(ALL_COUNTRY_OPTIONS.map((o) => o.code));

export function isValidCountryCode(code: string): boolean {
  return CODE_SET.has(code.trim().toUpperCase());
}

/** Display stored value: ISO2 → English name; legacy free-text returned as-is. */
export function formatStoredCountry(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const upper = raw.toUpperCase();
  if (upper.length === 2 && countries.isValid(upper)) {
    return countries.getName(upper, "en") ?? upper;
  }
  return raw;
}
