import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCountryCode } from "@/lib/countries-full";
import { hashOtpCode, generateNumericOtp } from "@/lib/otp";
import { sendSignInOtpEmail } from "@/lib/mail";
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
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
