import { z } from "zod";

/** POST /api/auth/email-otp/request */
export const emailOtpRequestBodySchema = z.object({
  email: z.string().email().max(320),
  country: z.string().min(2).max(2),
});

/** POST /api/cofounder-applications */
export const cofounderApplicationBodySchema = z.object({
  ideaId: z.string(),
  message: z.string().min(50).max(8000),
  commitmentKey: z.enum(["5-10", "10-20", "20-40", "40+"]),
  roleOffer: z.string().optional(),
});

/** POST /api/startup-ideas */
export const startupIdeaPostBodySchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    pitch: z.string().optional(),
    publicTeaser: z.string().optional(),
    protectionMode: z.enum(["FULL_PUBLIC", "TEASER_ONLY"]).default("FULL_PUBLIC"),
    rolesNeeded: z.array(z.string()),
    industries: z.array(z.string()),
    country: z.string().optional(),
    founderId: z.string(),
    coFounderSlotsWanted: z.coerce.number().int().min(1).max(50).default(1),
  })
  .refine(
    (data) =>
      data.protectionMode !== "TEASER_ONLY" ||
      (data.publicTeaser?.trim().length ?? 0) >= 20,
    {
      message:
        "Protected ideas need a public teaser (at least 20 characters) that does not reveal your secret details.",
      path: ["publicTeaser"],
    }
  );
