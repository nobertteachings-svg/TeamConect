"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { COFOUNDER_ROLE_OPTIONS } from "@/lib/cofounder-roles";

const COMMITMENT_KEYS = ["5-10", "10-20", "20-40", "40+"] as const;

export function ApplyCoFounderButton({
  ideaId,
  locale,
  slug,
  hasApplied,
  isOwner,
  canApply = true,
}: {
  ideaId: string;
  locale: string;
  slug?: string;
  hasApplied?: boolean;
  isOwner?: boolean;
  /** False when the team has all co-founder spots filled or the listing is closed. */
  canApply?: boolean;
}) {
  const t = useTranslations("cofoundersPage.apply");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [roleOffer, setRoleOffer] = useState("");
  const [commitmentKey, setCommitmentKey] = useState<(typeof COMMITMENT_KEYS)[number] | "">("");
  const [showForm, setShowForm] = useState(false);
  const [clientError, setClientError] = useState("");

  const callbackPath = `/${locale}/cofounders/${slug ?? ""}`;

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
        <p className="font-medium text-brand-green">{t("owner")}</p>
        <Link href={`/${locale}/dashboard/cofounders`} className="mt-2 inline-block text-brand-teal font-medium hover:underline">
          {tCommon("dashboard")}
        </Link>
      </div>
    );
  }

  if (!hasApplied && !canApply) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
        <p className="font-medium text-brand-green">{t("teamComplete")}</p>
      </div>
    );
  }

  if (hasApplied) {
    return (
      <div className="rounded-2xl border border-brand-teal/25 bg-gradient-to-br from-brand-teal/[0.06] to-white px-5 py-5">
        <p className="font-semibold text-brand-green">{t("applied")}</p>
        <p className="mt-1 text-sm text-stone-600 leading-relaxed">{t("appliedDetail")}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <button type="button" disabled className="px-6 py-3 rounded-xl bg-stone-200 text-stone-500 font-medium cursor-wait">
        {t("loading")}
      </button>
    );
  }

  if (!session) {
    return (
      <Link
        href={`/${locale}/sign-in?callbackUrl=${encodeURIComponent(callbackPath)}`}
        className="inline-flex w-full items-center justify-center rounded-xl bg-brand-green px-8 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-brand-green/15 transition hover:bg-brand-green-hover sm:w-auto sm:text-base"
      >
        {t("signIn")}
      </Link>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <label className="block text-sm font-semibold text-stone-800">{t("commitmentLabel")}</label>
          <select
            value={commitmentKey}
            onChange={(e) =>
              setCommitmentKey(e.target.value as (typeof COMMITMENT_KEYS)[number] | "")
            }
            className="mt-2 w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition"
          >
            <option value="">{t("commitmentPlaceholder")}</option>
            {COMMITMENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {k === "5-10"
                  ? t("h5_10")
                  : k === "10-20"
                    ? t("h10_20")
                    : k === "20-40"
                      ? t("h20_40")
                      : t("h40")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-800">{t("messageLabel")}</label>
          <p className="text-xs text-stone-500 mt-1 mb-2">{t("messageHint")}</p>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setClientError("");
            }}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition resize-y min-h-[120px]"
            placeholder=""
          />
          <p className="text-xs text-stone-400 mt-1">{message.length}/8000</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-800 mb-2">{t("roleLabel")}</label>
          <select
            value={roleOffer}
            onChange={(e) => setRoleOffer(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal outline-none transition"
          >
            <option value="">—</option>
            {COFOUNDER_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {clientError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{clientError}</p>
        )}

        <div className="flex flex-col gap-3 pt-1 xs:flex-row xs:flex-wrap">
          <button
            type="button"
            onClick={async () => {
              if (!commitmentKey) {
                setClientError(t("commitmentRequired"));
                return;
              }
              if (message.trim().length < 50) {
                setClientError(t("validation"));
                return;
              }
              setLoading(true);
              setClientError("");
              try {
                const res = await fetch("/api/cofounder-applications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ideaId,
                    message: message.trim(),
                    commitmentKey,
                    roleOffer: roleOffer || undefined,
                  }),
                });
                if (res.ok) {
                  router.refresh();
                  setShowForm(false);
                } else {
                  const d = await res.json().catch(() => ({}));
                  setClientError(typeof d.error === "string" ? d.error : t("submitFailed"));
                }
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-6 py-2.5 bg-brand-green text-white rounded-xl font-semibold hover:bg-brand-green-hover disabled:opacity-50 transition shadow-sm"
          >
            {loading ? t("submitting") : t("submit")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setClientError("");
            }}
            className="px-6 py-2.5 border border-stone-300 rounded-xl font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="inline-flex w-full items-center justify-center rounded-xl bg-brand-green px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-green/15 transition hover:bg-brand-green-hover sm:w-auto sm:text-base"
    >
      {t("cta")}
    </button>
  );
}
