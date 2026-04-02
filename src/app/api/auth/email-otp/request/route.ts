import { NextResponse } from "next/server";
import { isEmailOtpOffered } from "@/lib/email-otp-availability";
import { prisma } from "@/lib/prisma";
import { isValidCountryCode } from "@/lib/countries-full";
import { hashOtpCode, generateNumericOtp } from "@/lib/otp";
import { EmailSendError, sendSignInOtpEmail } from "@/lib/mail";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { emailOtpRequestBodySchema } from "@/lib/schemas/public-api";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  const authRl = await checkAuthRateLimit(request);
  if (authRl) return authRl;

  if (!isEmailOtpOffered()) {
    return NextResponse.json(
      {
        error:
          "Email sign-in codes are not enabled on this deployment. Use Google or GitHub, or add RESEND_API_KEY and a verified sender domain.",
      },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = emailOtpRequestBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const country = parsed.data.country.trim().toUpperCase();

  if (!isValidCountryCode(country)) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.emailOtpChallenge.count({
      where: { email, createdAt: { gte: since } },
    });
    if (recent >= MAX_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many code requests. Try again later." },
        { status: 429 }
      );
    }

    const code = generateNumericOtp(6);
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.emailOtpChallenge.deleteMany({ where: { email } });

    await prisma.emailOtpChallenge.create({
      data: { email, codeHash, country, expiresAt },
    });

    try {
      await sendSignInOtpEmail(email, code);
    } catch (e) {
      await prisma.emailOtpChallenge.deleteMany({ where: { email } });
      console.error(e);
      const message =
        e instanceof EmailSendError
          ? e.userMessage
          : "Could not send the sign-in email. Try again in a moment.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[email-otp/request]", e);
    return NextResponse.json(
      { error: "Something went wrong. Try again later." },
      { status: 503 }
    );
  }
}
