import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-config";
import { isValidCountryCode } from "@/lib/countries-full";
import { checkApiRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  country: z.string().min(2).max(2),
});

export async function PATCH(request: Request) {
  const apiRl = await checkApiRateLimit(request);
  if (apiRl) return apiRl;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const country = parsed.data.country.trim().toUpperCase();
  if (!isValidCountryCode(country)) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { country },
  });

  return NextResponse.json({ ok: true });
}
