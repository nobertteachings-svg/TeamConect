/**
 * Roles for startup ideas (rolesNeeded), filters, applications, and founder profiles.
 * Exact strings are stored in the DB — keep stable or migrate when renaming.
 */
export const COFOUNDER_ROLE_OPTIONS = [
  "Business co-founder",
  "CEO / strategy",
  "Domain expert",
  "CTO",
  "Developer / engineer",
  "Product",
  "Design",
  "Marketing",
  "Business Dev",
  "Sales & partnerships",
  "CFO",
  "Operations",
] as const;

export type CofounderRoleOption = (typeof COFOUNDER_ROLE_OPTIONS)[number];

/** Profile “seeking role” select includes an open-ended fallback */
export const FOUNDER_SEEKING_ROLE_OPTIONS = [
  ...COFOUNDER_ROLE_OPTIONS,
  "Other",
] as const;
