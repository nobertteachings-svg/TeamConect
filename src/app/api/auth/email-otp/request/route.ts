import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
          "Email sign-in codes are not enabled on this deployment. Use Google or GitHub, or configure Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) or Resend with a verified domain.",
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
    let error = "Something went wrong. Try again later.";
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2021" || e.code === "P2010") {
        error =
          "Sign-in email storage is not ready (database migration may be missing). Contact the site admin.";
      } else {
        error = "Could not save your sign-in request. Please try again in a moment.";
      }
    } else if (e instanceof Prisma.PrismaClientInitializationError) {
      error = "Database connection failed. Check DATABASE_URL on the server.";
    } else if (e instanceof Prisma.PrismaClientRustPanicError) {
      error = "Database error. Please try again in a moment.";
    }
    return NextResponse.json({ error }, { status: 503 });
  }
}
