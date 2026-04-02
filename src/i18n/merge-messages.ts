type JsonObject = Record<string, unknown>;

/** Locale messages override English; missing keys inherit from `en`. */
export function mergeMessages(en: JsonObject, locale: JsonObject): JsonObject {
  const out = structuredClone(en) as JsonObject;
  for (const key of Object.keys(locale)) {
    const ev = en[key];
    const ov = locale[key];
    if (
      ov !== null &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      ev !== null &&
      typeof ev === "object" &&
      !Array.isArray(ev)
    ) {
      out[key] = mergeMessages(ev as JsonObject, ov as JsonObject);
    } else {
      out[key] = ov;
    }
  }
  return out;
}
