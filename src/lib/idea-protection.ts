import type { IdeaProtection } from "@prisma/client";
import { blurbFromDescription } from "./idea-display";

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
  /** When set, description is cleaned (duplicate title / headings) and shortened for the card. */
  title?: string;
}): string {
  if (params.protectionMode === "TEASER_ONLY") {
    return (
      params.publicTeaser?.trim() ||
      "Protected idea — open for the public teaser."
    );
  }
  if (params.title?.trim()) {
    return blurbFromDescription(params.description, params.title);
  }
  return params.description.trim();
}
