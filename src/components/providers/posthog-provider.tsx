"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (typeof window !== "undefined" && key) {
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!key) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
