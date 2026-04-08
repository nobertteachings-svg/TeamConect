"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { PENDING_OAUTH_COUNTRY_KEY } from "@/components/auth/pending-country-from-sign-in-sync";
import { CountrySelect } from "@/components/forms/country-select";

type SignInClientProps = {
  emailOtpOffered: boolean;
};

export function SignInClient({ emailOtpOffered }: SignInClientProps) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountDisabled = searchParams.get("error") === "AccountDisabled";
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") ? rawCallback : `/${locale}/dashboard`;

  const [country, setCountry] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"pick" | "code">("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!country) {
      setError(t("countryRequired"));
      return;
    }
    const nameTrim = fullName.trim();
    if (nameTrim.length < 2) {
      setError(t("nameRequired"));
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t("emailInvalid"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/email-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, country }),
      });
      const raw = await res.text();
      let data: { error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string };
        } catch {
          /* non-JSON (e.g. edge HTML) */
        }
      }
      if (!res.ok) {
        setError(data.error?.trim() || t("otpFailed"));
        return;
      }
      setStep("code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    const c = code.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(c)) {
      setError(t("codeInvalid"));
      return;
    }
    setBusy(true);
    try {
      const res = await signIn("email-otp", {
        email: trimmed,
        code: c,
        name: fullName.trim().slice(0, 80),
        redirect: false,
      });
      if (res?.error) {
        setError(t("otpInvalid"));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen min-w-0 flex-col items-center justify-center overflow-x-clip bg-gradient-to-b from-stone-100/80 via-white to-stone-50 px-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] sm:px-4 sm:pb-[max(5rem,env(safe-area-inset-bottom))] sm:pt-[max(5rem,env(safe-area-inset-top))]">
      <Logo
        href={`/${locale}`}
        locale={locale}
        size="xl"
        prominent
        className="mb-8 xs:mb-10"
      />
      <div className="tc-card w-full max-w-md min-w-0 p-6 shadow-tc-md xs:p-8 sm:p-10">
        <h1 className="mb-3 text-center text-2xl font-bold tracking-tight text-brand-green sm:text-[1.65rem]">
          {t("title")}
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed text-stone-600">{t("subtitle")}</p>
        {accountDisabled && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
            {t("accountDisabled")}
          </p>
        )}

        <p className="mb-4 text-center text-xs leading-relaxed text-stone-500">{t("oauthCountryHint")}</p>

        <div className="mb-6 space-y-3">
          <div>
            <label htmlFor="signin-country-oauth" className="tc-label">
              {t("countryLabel")}
            </label>
            <CountrySelect
              id="signin-country-oauth"
              value={country}
              onChange={setCountry}
              placeholder={t("countryPlaceholder")}
              className="tc-select mt-1.5 w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (!country?.trim()) {
                setError(t("countryRequired"));
                return;
              }
              try {
                sessionStorage.setItem(PENDING_OAUTH_COUNTRY_KEY, country.trim().toUpperCase());
              } catch {
                /* private mode */
              }
              void signIn("google", { callbackUrl });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50/90"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("google")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (!country?.trim()) {
                setError(t("countryRequired"));
                return;
              }
              try {
                sessionStorage.setItem(PENDING_OAUTH_COUNTRY_KEY, country.trim().toUpperCase());
              } catch {
                /* private mode */
              }
              void signIn("github", { callbackUrl });
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-[#24292f] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a1e22]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
            {t("github")}
          </button>
        </div>

        {error && (!emailOtpOffered || step === "pick") && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
            {error}
          </p>
        )}

        {!emailOtpOffered && (
          <p className="mt-8 rounded-xl border border-stone-200/90 bg-stone-50/80 px-4 py-3 text-center text-sm leading-relaxed text-stone-600">
            {t("emailOtpUnavailable")}
          </p>
        )}

        {emailOtpOffered && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide">
                <span className="bg-white px-3 text-stone-400">{t("divider")}</span>
              </div>
            </div>

            {step === "pick" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label htmlFor="signin-name" className="tc-label">
                {t("nameLabel")}
              </label>
              <input
                id="signin-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="tc-input mt-1.5 w-full"
                disabled={busy}
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div>
              <label htmlFor="signin-email" className="tc-label">
                {t("emailLabel")}
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="tc-input mt-1.5 w-full"
                disabled={busy}
                required
              />
            </div>
            <button type="submit" disabled={busy} className="tc-btn-primary w-full py-3.5 disabled:opacity-50">
              {busy ? t("sendingCode") : t("sendCode")}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-center text-sm text-stone-600">
              {t("codeSent", { email: email.trim().toLowerCase() })}
            </p>
            <div>
              <label htmlFor="signin-code" className="tc-label">
                {t("codeLabel")}
              </label>
              <input
                id="signin-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="tc-input mt-1.5 w-full text-center font-mono text-lg tracking-widest"
                disabled={busy}
                required
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="tc-btn-primary w-full py-3.5 disabled:opacity-50">
              {busy ? t("otpVerifying") : t("verifyCode")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("pick");
                setCode("");
                setError(null);
              }}
              className="w-full text-center text-sm font-semibold text-brand-teal hover:text-brand-green"
            >
              {t("changeEmail")}
            </button>
          </form>
            )}
          </>
        )}

        <p className="mt-8 text-center text-sm text-stone-500">
          <Link href={`/${locale}`} className="font-semibold text-brand-teal transition hover:text-brand-green">
            {t("backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
