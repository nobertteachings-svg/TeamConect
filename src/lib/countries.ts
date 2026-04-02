/**
 * Country lists for filters and forms — ISO 3166-1 alpha-2 in URLs/DB, English labels for display.
 */

export {
  ALL_COUNTRY_OPTIONS,
  formatStoredCountry,
  isValidCountryCode,
  type CountryOption,
} from "./countries-full";

/** Quick filter chips on co-founders listings (ISO2 codes; labels via formatStoredCountry). */
export const COUNTRY_FILTER_CHIP_CODES = [
  "US",
  "GB",
  "CA",
  "DE",
  "FR",
  "IN",
  "SG",
  "NG",
  "KE",
  "BR",
  "AU",
  "ZA",
] as const;
