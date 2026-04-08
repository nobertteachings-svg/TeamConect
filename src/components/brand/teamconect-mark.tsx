/**
 * Fallback mark — interlocking arcs on navy tile (logo palette: blue + orange).
 */
export function TeamConectMark({
  size = 40,
  className = "",
  title = "TeamConect",
}: {
  size?: number;
  className?: string;
  /** Set empty to mark as decorative */
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`shrink-0 ${className}`}
      role={title ? "img" : "presentation"}
      aria-hidden={!title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="48" height="48" rx="12" fill="#004A8D" />
      <path
        d="M14 26c0-5.5 4.5-9 10-9s10 3.5 10 9"
        stroke="#1E73BE"
        strokeWidth="2.25"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 22c0 5.5-4.5 9-10 9s-10-3.5-10-9"
        stroke="#F7941D"
        strokeWidth="2.25"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="24" r="3" fill="#fafaf9" opacity="0.95" />
    </svg>
  );
}
