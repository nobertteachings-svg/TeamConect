export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateSlug(text: string, existing?: string[]): string {
  const base = slugify(text);
  const slugSet = new Set(existing ?? []);
  let slug = base;
  let i = 1;
  while (slugSet.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}
