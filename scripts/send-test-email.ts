/**
 * Send a test message using the same transport as the app (SMTP if configured, else Resend).
 * Loads `.env` from the project root without extra dependencies.
 *
 * Usage: npm run email:test -- you@example.com
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadDotEnv() {
  const p = join(process.cwd(), ".env");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const to = (process.argv[2] ?? "").trim();
if (!to) {
  console.error("Usage: npm run email:test -- you@example.com");
  process.exit(1);
}

async function main() {
  const { isSmtpMailConfigured } = await import("../src/lib/mail-config");
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  if (!isSmtpMailConfigured() && !hasResend) {
    console.error("Configure GMAIL_USER + GMAIL_APP_PASSWORD (or SMTP_* / SMTP_URL), or RESEND_API_KEY in .env");
    process.exit(1);
  }
  const { sendTestEmail } = await import("../src/lib/mail");
  await sendTestEmail(to);
  console.log("Sent test email to", to);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
