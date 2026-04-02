/**
 * Send a one-off test email via Resend (same API as src/lib/mail.ts).
 * Loads `.env` from the project root without extra dependencies.
 *
 * Usage: npx tsx scripts/send-test-email.ts
 *        npx tsx scripts/send-test-email.ts you@example.com
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

const key = process.env.RESEND_API_KEY?.trim();
if (!key) {
  console.error("Missing RESEND_API_KEY in .env");
  process.exit(1);
}

const from =
  process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, "") ?? "onboarding@resend.dev";
const to = (process.argv[2] ?? "ekfuingeinkwain@gmail.com").trim();

async function main() {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error("Resend error:", res.status, body);
    process.exit(1);
  }
  console.log("Email sent:", body);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
