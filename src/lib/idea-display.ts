/**
 * Normalize founder-pasted idea text (often includes the title again or markdown-ish headings).
 */

/** Remove leading line(s) that repeat the idea title (exact or with # / markdown noise). */
export function stripRedundantTitleFromBody(body: string, title: string): string {
  const nt = title.trim().toLowerCase().replace(/\s+/g, " ");
  if (!nt) return body.trim();

  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return body.trim();

  const normalizeLine = (raw: string) =>
    raw
      .replace(/^#+\s*/, "")
      .replace(/^[*_]+\s*/, "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  let changed = false;
  while (i < lines.length) {
    const norm = normalizeLine(lines[i]);
    const withoutPeriod = norm.replace(/\.$/, "");
    const matches =
      norm === nt ||
      withoutPeriod === nt ||
      norm.startsWith(`${nt} —`) ||
      norm.startsWith(`${nt} -`) ||
      norm.startsWith(`${nt}:`);
    if (!matches) break;
    lines.splice(i, 1);
    changed = true;
    while (i < lines.length && lines[i].trim() === "") lines.splice(i, 1);
  }

  return (changed ? lines.join("\n") : body).trim();
}

/** Split long text into paragraphs for readable layout (double newlines). */
export function splitIdeaParagraphs(text: string): string[] {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** One-line summary for listing cards from full description. */
export function blurbFromDescription(description: string, title: string, maxLen = 280): string {
  const cleaned = stripRedundantTitleFromBody(description, title);
  const firstBlock = cleaned.split(/\n\n+/)[0] ?? cleaned;
  const oneLine = firstBlock.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  const cut = oneLine.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
