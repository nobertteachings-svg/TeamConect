import { Fragment, type ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

function linkify(text: string): ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_RE.source, "g");
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(<Fragment key={`t${key++}`}>{text.slice(last, m.index)}</Fragment>);
    }
    const href = m[0];
    out.push(
      <a
        key={`a${key++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-brand-teal underline decoration-brand-teal/40 underline-offset-2 hover:text-brand-green"
      >
        {href}
      </a>
    );
    last = m.index + href.length;
  }
  if (last < text.length) {
    out.push(<Fragment key={`t${key++}`}>{text.slice(last)}</Fragment>);
  }
  return out.length ? out : [text];
}

/**
 * Light formatting for founder-written idea text: **bold**, `code`, autolinked URLs.
 * Avoids full markdown dependency; safe for user-provided text (no raw HTML).
 */
export function FormattedIdeaParagraph({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <p className="max-w-full break-words whitespace-pre-wrap leading-relaxed [overflow-wrap:anywhere]">
      {parts.map((seg, i) => {
        if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
          return (
            <strong key={i} className="font-semibold text-stone-900">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2) {
          return (
            <code
              key={i}
              className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[0.9em] text-stone-800"
            >
              {seg.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{linkify(seg)}</Fragment>;
      })}
    </p>
  );
}
