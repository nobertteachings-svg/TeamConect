"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Set on the sign-in page before OAuth redirect; applied after return on complete-country / dashboard flow. */
export const PENDING_OAUTH_COUNTRY_KEY = "tc_pending_country";

/**
 * If the user chose a country on /sign-in before Google/GitHub, persist it to the account
 * after OAuth (JWT may not include country until DB is updated + session.update).
 */
export function PendingCountryFromSignInSync() {
  const { status, update } = useSession();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || ran.current) return;
    const raw =
      typeof window !== "undefined" ? sessionStorage.getItem(PENDING_OAUTH_COUNTRY_KEY) : null;
    if (!raw || raw.length !== 2) return;
    ran.current = true;
    const country = raw.toUpperCase();

    void (async () => {
      try {
        const res = await fetch("/api/user/country", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country }),
        });
        if (res.ok) {
          sessionStorage.removeItem(PENDING_OAUTH_COUNTRY_KEY);
          await update();
          router.refresh();
        } else {
          ran.current = false;
        }
      } catch {
        ran.current = false;
      }
    })();
  }, [status, update, router]);

  return null;
}
