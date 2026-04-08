import { NextResponse } from "next/server";
import { limitApi, limitAuth, limitWaitlist } from "./ratelimit";

export function getRateLimitIdentifier(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  const real = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  return cf || real || forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function checkApiRateLimit(
  request: Request
): Promise<NextResponse | null> {
  const { success } = await limitApi(getRateLimitIdentifier(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  return null;
}

export async function checkAuthRateLimit(
  request: Request
): Promise<NextResponse | null> {
  try {
    const { success } = await limitAuth(getRateLimitIdentifier(request));
    if (!success) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Try again in an hour." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }
  } catch (e) {
    console.error("[rate-limit/auth]", e);
  }
  return null;
}

export async function checkWaitlistRateLimit(
  request: Request
): Promise<NextResponse | null> {
  const { success } = await limitWaitlist(getRateLimitIdentifier(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Try again in an hour." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }
  return null;
}
