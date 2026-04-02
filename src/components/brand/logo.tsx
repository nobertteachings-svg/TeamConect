"use client";

import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  locale?: string;
  size?: "sm" | "md" | "lg";
  /** Wordmark PNG includes the name; set true only if you want extra text beside the image */
  showText?: boolean;
  className?: string;
};

/** Display height (px); width follows 1536×1024 intrinsic aspect ratio */
const heights = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

export function Logo({
  href,
  size = "md",
  showText = false,
  className = "",
}: LogoProps) {
  const h = heights[size];
  const content = (
    <>
      <Image
        src="/logo.png"
        alt="TeamConnect"
        width={1536}
        height={1024}
        className="w-auto object-contain object-left shrink-0"
        style={{ height: h }}
        priority={size !== "sm"}
      />
      {showText && (
        <span className="font-bold text-brand-green tracking-tight">
          Team
          <span className="font-semibold text-brand-gold">Connect</span>
        </span>
      )}
    </>
  );

  const wrapperClass = `inline-flex items-center gap-2 ${className}`;

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="TeamConnect - Home">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
