import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://teamconect.com";
const PATHS = ["", "cofounders", "community"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of PATHS) {
      entries.push({
        url: `${BASE_URL}/${locale}${path ? `/${path}` : ""}`,
        lastModified: new Date(),
        changeFrequency: path ? "weekly" : "daily",
        priority: path ? 0.8 : 1,
      });
    }
  }

  return entries;
}
