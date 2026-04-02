import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkWaitlistRateLimit } from "@/lib/rate-limit";
import { isValidCountryCode } from "@/lib/countries-full";
import { sendWaitlistConfirmationEmail } from "@/lib/mail";

const schema = z.object({
  email: z.string().email(),
  role: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(request: Request) {
  const rateLimitRes = await checkWaitlistRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await request.json();
    const data = schema.parse(body);

    let countryNorm: string | null | undefined = data.country?.trim();
    if (countryNorm === "") countryNorm = undefined;
    if (countryNorm) {
      countryNorm = countryNorm.toUpperCase();
      if (!isValidCountryCode(countryNorm)) {
        return NextResponse.json({ error: "Invalid country" }, { status: 400 });
      }
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    await prisma.waitlistEntry.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        role: data.role ?? null,
        country: countryNorm ?? null,
        language: data.language ?? null,
      },
      update: {
        role: data.role ?? undefined,
        country: countryNorm ?? undefined,
        language: data.language ?? undefined,
      },
    });

    if (!existing) {
      void sendWaitlistConfirmationEmail(data.email).catch((err) =>
        console.error("Waitlist confirmation email:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
