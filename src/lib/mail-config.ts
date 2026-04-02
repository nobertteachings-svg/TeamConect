/**
 * Shared detection for outbound email configuration (used by mail sending + sign-in UI).
 */

export function isSmtpMailConfigured(): boolean {
  if (process.env.SMTP_URL?.trim()) return true;
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim()?.replace(/\s+/g, "") ?? "";
  if (gmailUser && gmailPass.length > 0) return true;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(host && user && pass);
}
