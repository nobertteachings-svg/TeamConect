/**
 * Transactional email: SMTP (Gmail / Nodemailer) when configured, otherwise Resend (https://resend.com).
 *
 * Auto transport: if `GMAIL_USER` + `GMAIL_APP_PASSWORD`, `SMTP_URL`, or `SMTP_HOST`+user+pass are set, SMTP is used;
 * else Resend. Override with `EMAIL_TRANSPORT=smtp` or `EMAIL_TRANSPORT=resend`.
 *
 * Without any provider: in development, messages are logged to the server console only; in production, sends throw EmailSendError.
 *
 * Logo: prefers `logo.png` at project root or `public/logo.png`, else `public/teamconnect-mark.svg`
 * as an inline CID attachment (displays in the header and is included as an email attachment part).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { isSmtpMailConfigured } from "./mail-config";

const SITE_NAME = "TeamConnect";
const LOGO_CID = "teamconnect-logo";
const BRAND_PRIMARY = "#004a8d";
const BRAND_ACCENT = "#1e73be";
const STONE_600 = "#57534e";
const STONE_200 = "#e7e5e4";
const STONE_50 = "#fafaf9";

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://teamconnect.com").replace(/\/$/, "");
}

export type LogoAttachment = {
  filename: string;
  content: string;
  content_id: string;
  content_type: string;
};

/** Text-only header (no CID attachments) — used for sign-in OTP to keep payloads small. */
function textOnlyLogoBlock(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:22px;font-weight:700;color:${BRAND_PRIMARY};letter-spacing:-0.02em;font-family:system-ui,-apple-system,sans-serif;">${SITE_NAME}</td></tr></table>`;
}

/**
 * Load logo for inline CID + attachment. Falls back to text-only header if no file found.
 */
export function getEmailLogoAttachments(): {
  attachments: LogoAttachment[];
  logoBlock: string;
} {
  const candidates: { path: string; filename: string; contentType: string }[] = [
    { path: join(process.cwd(), "logo.png"), filename: "teamconnect-logo.png", contentType: "image/png" },
    { path: join(process.cwd(), "public", "logo.png"), filename: "teamconnect-logo.png", contentType: "image/png" },
    {
      path: join(process.cwd(), "public", "teamconnect-mark.svg"),
      filename: "teamconnect-mark.svg",
      contentType: "image/svg+xml",
    },
  ];

  for (const c of candidates) {
    if (!existsSync(c.path)) continue;
    try {
      const content = readFileSync(c.path).toString("base64");
      const logoBlock = `<img src="cid:${LOGO_CID}" alt="${SITE_NAME}" width="52" height="52" style="display:block;width:52px;height:52px;border:0;border-radius:12px;" />`;
      return {
        attachments: [
          {
            filename: c.filename,
            content,
            content_id: LOGO_CID,
            content_type: c.contentType,
          },
        ],
        logoBlock,
      };
    } catch {
      continue;
    }
  }

  return {
    attachments: [],
    logoBlock: textOnlyLogoBlock(),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Thrown when transactional email fails; `userMessage` is safe to return to the client. */
export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly userMessage: string
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

type SendEmailInput = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  attachments: LogoAttachment[];
  tags?: { name: string; value: string }[];
};

function userMessageFromResendBody(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (
    lower.includes("only send testing emails to your own email") ||
    lower.includes("verify a domain")
  ) {
    return "Sign-in email cannot be sent to this address yet: add a verified domain in Resend and set EMAIL_FROM, or sign in with Google or GitHub.";
  }
  if (lower.includes("domain") && (lower.includes("verify") || lower.includes("not verified"))) {
    return "Email could not be sent: check your Resend domain verification and EMAIL_FROM address.";
  }
  if (status === 401 || lower.includes("invalid api key") || lower.includes("unauthorized")) {
    return "Email could not be sent: Resend API key is missing or invalid (check RESEND_API_KEY on the server).";
  }
  return "Could not send the sign-in email. Try again in a moment, or use Google or GitHub sign-in.";
}

function userMessageFromSmtpError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid login") ||
    lower.includes("authentication failed") ||
    lower.includes("eauth") ||
    lower.includes("535-5.7.8") ||
    lower.includes("username and password not accepted")
  ) {
    return "Email could not be sent: check GMAIL_USER and GMAIL_APP_PASSWORD (use a Google App Password, not your normal password).";
  }
  if (lower.includes("quota") || lower.includes("limit exceeded")) {
    return "Email could not be sent: sending limit reached. Try again later or use another mail provider.";
  }
  return "Could not send the sign-in email. Try again in a moment, or use Google or GitHub sign-in.";
}

function resolveSmtpFromAddress(): string {
  const explicit = process.env.EMAIL_FROM?.trim();
  if (explicit) return explicit.replace(/^["']|["']$/g, "");
  const gu = process.env.GMAIL_USER?.trim();
  if (gu) return `${SITE_NAME} <${gu}>`;
  const su = process.env.SMTP_USER?.trim();
  if (su) return `${SITE_NAME} <${su}>`;
  return `${SITE_NAME} <noreply@localhost>`;
}

function createSmtpTransporter(): nodemailer.Transporter {
  const url = process.env.SMTP_URL?.trim();
  if (url) {
    return nodemailer.createTransport(url);
  }
  const gmailUser = process.env.GMAIL_USER?.trim();
  const rawGmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (gmailUser && rawGmailPass) {
    const gmailPass = rawGmailPass.replace(/\s+/g, "");
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
  }
  const host = process.env.SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    throw new Error("SMTP transport incomplete: set SMTP_URL or GMAIL_* or SMTP_HOST+SMTP_USER+SMTP_PASS");
  }
  const secure =
    process.env.SMTP_SECURE === "1" ||
    process.env.SMTP_SECURE === "true" ||
    port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  let transporter: nodemailer.Transporter;
  try {
    transporter = createSmtpTransporter();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new EmailSendError(
      msg,
      "SMTP configuration is incomplete. Set GMAIL_USER + GMAIL_APP_PASSWORD, SMTP_URL, or SMTP_HOST + SMTP_USER + SMTP_PASS."
    );
  }
  const from = resolveSmtpFromAddress();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;
  const attachments =
    input.attachments.length > 0
      ? input.attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.content, "base64"),
          cid: a.content_id,
          contentType: a.content_type,
        }))
      : undefined;

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mail] SMTP:", msg);
    throw new EmailSendError(msg, userMessageFromSmtpError(msg));
  }
}

function emailShell(options: {
  preheader: string;
  title: string;
  bodyHtml: string;
  footerExtra?: string;
  logoBlock: string;
}): string {
  const year = new Date().getFullYear();
  const base = siteBaseUrl();
  const pre = escapeHtml(options.preheader);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(options.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${STONE_50};font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${pre}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${STONE_50};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;border:1px solid ${STONE_200};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid ${STONE_200};background:linear-gradient(180deg,#ffffff 0%,#fafaf9 100%);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">${options.logoBlock}</td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND_ACCENT};">${SITE_NAME}</div>
                    <div style="font-size:15px;font-weight:600;color:${STONE_600};margin-top:4px;line-height:1.35;">${escapeHtml(options.title)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;color:${STONE_600};font-size:15px;line-height:1.65;">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px 32px;border-top:1px solid ${STONE_200};background-color:#fafaf9;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#78716c;">
                ${options.footerExtra ?? ""}
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a8a29e;">
                © ${year} ${SITE_NAME}. All rights reserved.<br />
                <a href="${base}" style="color:${BRAND_ACCENT};text-decoration:none;">${escapeHtml(base.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0 0;font-size:11px;line-height:1.5;color:#a8a29e;max-width:560px;">
          This is a transactional message from ${SITE_NAME}. If you did not expect this email, you can safely disregard it or contact our team if you have concerns.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailSendError(
        "RESEND_API_KEY is unset in production",
        "Sign-in email is not configured on this server. Use Google or GitHub, or contact support."
      );
    }
    console.info(`[mail] (no RESEND_API_KEY) → ${input.to.join(", ")} | ${input.subject}`);
    console.info(input.text);
    return;
  }

  const payload: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(input.attachments.length ? { attachments: input.attachments } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    const userMessage = userMessageFromResendBody(res.status, text);
    console.error(`[mail] Resend ${res.status}: ${text}`);
    throw new EmailSendError(`Resend error: ${res.status} ${text}`, userMessage);
  }
}

async function sendEmail(input: SendEmailInput): Promise<void> {
  const mode = process.env.EMAIL_TRANSPORT?.trim().toLowerCase();
  if (mode === "smtp") {
    if (!isSmtpMailConfigured()) {
      throw new EmailSendError(
        "EMAIL_TRANSPORT=smtp but SMTP is not fully configured",
        "Email is not configured: set GMAIL_USER + GMAIL_APP_PASSWORD, or SMTP_URL, or SMTP_HOST + SMTP_USER + SMTP_PASS."
      );
    }
    await sendViaSmtp(input);
    return;
  }
  if (mode === "resend") {
    await sendViaResend(input);
    return;
  }
  if (isSmtpMailConfigured()) {
    await sendViaSmtp(input);
    return;
  }
  if (process.env.EMAIL_SMTP_ONLY === "1" || process.env.EMAIL_SMTP_ONLY === "true") {
    throw new EmailSendError(
      "EMAIL_SMTP_ONLY set but SMTP is not configured",
      "Email is not configured: set GMAIL_USER + GMAIL_APP_PASSWORD (or other SMTP_* variables)."
    );
  }
  await sendViaResend(input);
}

async function sendBrandedEmail(params: {
  to: string[];
  subject: string;
  preheader: string;
  headerTitle: string;
  bodyHtml: string;
  text: string;
  footerExtra?: string;
  tags?: { name: string; value: string }[];
  /** `"text"` = no logo attachments (recommended for OTP and deliverability). */
  branding?: "full" | "text";
}): Promise<void> {
  const { attachments, logoBlock } =
    params.branding === "text"
      ? { attachments: [] as LogoAttachment[], logoBlock: textOnlyLogoBlock() }
      : getEmailLogoAttachments();
  const html = emailShell({
    preheader: params.preheader,
    title: params.headerTitle,
    bodyHtml: params.bodyHtml,
    footerExtra: params.footerExtra,
    logoBlock,
  });
  await sendEmail({
    to: params.to,
    subject: params.subject,
    html,
    text: params.text,
    attachments,
    tags: params.tags,
  });
}

/** One-off test send (same transport as production). Use: `npm run email:test -- you@example.com` */
export async function sendTestEmail(to: string): Promise<void> {
  await sendBrandedEmail({
    to: [to],
    subject: `${SITE_NAME} test email`,
    preheader: "Outbound mail test",
    headerTitle: "Test email",
    bodyHtml: "<p>If you received this, outbound mail is configured correctly.</p>",
    text: "If you received this, outbound mail is configured correctly.",
    branding: "text",
  });
}

/**
 * One-time password for email sign-in.
 */
export async function sendSignInOtpEmail(to: string, code: string): Promise<void> {
  const safeCode = escapeHtml(code);
  const base = siteBaseUrl();
  const subject = `Your secure sign-in code — ${SITE_NAME}`;
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hello,</p>
    <p style="margin:0 0 20px 0;">You requested to sign in to your <strong>${SITE_NAME}</strong> account. Use the verification code below to complete sign-in. This code is valid for <strong>10 minutes</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:#f5f5f4;border-radius:12px;border:1px solid ${STONE_200};padding:20px 28px;text-align:center;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#78716c;">Verification code</p>
          <p style="margin:0;font-family:'SF Mono',ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:0.35em;color:${BRAND_PRIMARY};">${safeCode}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 12px 0;font-size:14px;color:#57534e;">For your security, do not share this code with anyone. ${SITE_NAME} will never ask you for this code by phone or on social media.</p>
    <p style="margin:0;font-size:14px;color:#57534e;">If you did not attempt to sign in, you can ignore this message — your account remains secure.</p>
  `;

  await sendBrandedEmail({
    to: [to],
    subject,
    preheader: `Your ${SITE_NAME} sign-in code is ${code}. Valid for 10 minutes.`,
    headerTitle: "Secure sign-in verification",
    bodyHtml,
    branding: "text",
    footerExtra: `Need help? Reply to this email or visit our website at <a href="${base}" style="color:${BRAND_ACCENT};text-decoration:none;">${escapeHtml(base.replace(/^https?:\/\//, ""))}</a>.`,
    text: [
      `${SITE_NAME} — secure sign-in`,
      "",
      "Use this verification code to complete sign-in (valid 10 minutes):",
      "",
      `  ${code}`,
      "",
      "Do not share this code. If you did not request it, ignore this email.",
      "",
      base,
    ].join("\n"),
    tags: [{ name: "category", value: "sign-in-otp" }],
  });
}

/**
 * Waitlist confirmation when a new email is added (not on profile updates).
 */
export async function sendWaitlistConfirmationEmail(to: string): Promise<void> {
  const base = siteBaseUrl();
  const subject = `Thank you — you're on the ${SITE_NAME} waitlist`;
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hello,</p>
    <p style="margin:0 0 16px 0;">Thank you for your interest in <strong>${SITE_NAME}</strong>. We've received your request to join our waitlist.</p>
    <p style="margin:0 0 16px 0;">We're building a space for founders and collaborators to connect — share ideas, find co-founders, and grow together. You'll be among the first to know when we open new spots or share product updates.</p>
    <p style="margin:0;font-size:14px;color:#57534e;">If you have questions in the meantime, simply reply to this email — we're glad to help.</p>
  `;

  await sendBrandedEmail({
    to: [to],
    subject,
    preheader: `You're on the ${SITE_NAME} waitlist. We'll be in touch with updates.`,
    headerTitle: "Waitlist confirmation",
    bodyHtml,
    footerExtra: `Visit <a href="${base}" style="color:${BRAND_ACCENT};text-decoration:none;">${escapeHtml(base.replace(/^https?:\/\//, ""))}</a> anytime to learn more.`,
    text: [
      `${SITE_NAME} — waitlist confirmation`,
      "",
      "Thank you for joining our waitlist. We've saved your details and will keep you posted on updates and availability.",
      "",
      base,
    ].join("\n"),
    tags: [{ name: "category", value: "waitlist" }],
  });
}

/**
 * Notifies the idea owner that a new co-founder application was submitted.
 */
export async function sendNewCoFounderApplicationEmail(params: {
  to: string;
  ideaTitle: string;
  applicantLabel: string;
  dashboardUrl: string;
  ideaPublicUrl: string;
}): Promise<void> {
  const safeTitle = escapeHtml(params.ideaTitle);
  const safeApplicant = escapeHtml(params.applicantLabel);
  const subject = `New co-founder application — ${params.ideaTitle}`;
  const bodyHtml = `
    <p style="margin:0 0 16px 0;">Hello,</p>
    <p style="margin:0 0 16px 0;">You have received a new co-founder application for your startup idea <strong>${safeTitle}</strong> on <strong>${SITE_NAME}</strong>.</p>
    <p style="margin:0 0 20px 0;"><strong>Applicant:</strong> ${safeApplicant}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:10px;background-color:${BRAND_PRIMARY};text-align:center;">
          <a href="${params.dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Review application in dashboard</a>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0 0;font-size:14px;color:#57534e;">You can also <a href="${params.ideaPublicUrl}" style="color:${BRAND_ACCENT};text-decoration:none;">view the public idea listing</a>.</p>
  `;

  await sendBrandedEmail({
    to: [params.to],
    subject,
    preheader: `Someone applied to join ${params.ideaTitle} on ${SITE_NAME}.`,
    headerTitle: "New application received",
    bodyHtml,
    footerExtra: `Questions about ${SITE_NAME}? Reply to this email or visit <a href="${siteBaseUrl()}" style="color:${BRAND_ACCENT};text-decoration:none;">our site</a>.`,
    text: [
      `${SITE_NAME} — new co-founder application`,
      "",
      `Idea: ${params.ideaTitle}`,
      `Applicant: ${params.applicantLabel}`,
      "",
      "Review the application in your dashboard:",
      params.dashboardUrl,
      "",
      "Public idea page:",
      params.ideaPublicUrl,
    ].join("\n"),
    tags: [{ name: "category", value: "cofounder-application" }],
  });
}
