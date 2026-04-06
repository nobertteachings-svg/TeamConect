import { isSmtpMailConfigured } from "./mail-config";

/**
 * Controls whether we show email OTP on sign-in and accept POST /api/auth/email-otp/request.
 *
 * Production: offered if SMTP is configured (Gmail app password, etc.) or Resend is set up
 * with a non-test `from` address. Resend's onboarding@resend.dev only delivers to your own inbox.
 *
 * If `EMAIL_TRANSPORT=smtp` or `EMAIL_SMTP_ONLY=1`, only SMTP counts (Gmail or generic SMTP) — Resend is ignored for gating.
 *
 * Override: EMAIL_OTP_ENABLED=true | false | 1 | 0 | on | off
 */
export function isEmailOtpOffered(): boolean {
  const raw = process.env.EMAIL_OTP_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const smtpForced =
    process.env.EMAIL_TRANSPORT?.trim().toLowerCase() === "smtp" ||
    process.env.EMAIL_SMTP_ONLY === "1" ||
    process.env.EMAIL_SMTP_ONLY === "true";

  if (smtpForced) {
    return isSmtpMailConfigured();
  }

  if (isSmtpMailConfigured()) {
    return true;
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const from = process.env.EMAIL_FROM?.trim() ?? "";
  if (from.toLowerCase().includes("onboarding@resend.dev")) {
    return false;
  }

  return true;
}
