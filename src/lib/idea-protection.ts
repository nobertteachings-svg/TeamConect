import type { IdeaProtection } from "@prisma/client";

export function canViewFullIdeaDetails(params: {
  protectionMode: IdeaProtection;
  founderUserId: string;
  viewerUserId: string | undefined;
  hasApplication: boolean;
}): boolean {
  const { protectionMode, founderUserId, viewerUserId, hasApplication } = params;
  if (protectionMode === "FULL_PUBLIC") return true;
  if (!viewerUserId) return false;
  if (viewerUserId === founderUserId) return true;
  return hasApplication;
}

/** Text shown on listing cards — never exposes full description for TEASER_ONLY */
export function publicListingBlurb(params: {
  protectionMode: IdeaProtection;
  publicTeaser: string | null;
  description: string;
}): string {
  if (params.protectionMode === "TEASER_ONLY") {
    return (
      params.publicTeaser?.trim() ||
      "Protected idea — open for the public teaser."
    );
  }
  return params.description;
}
