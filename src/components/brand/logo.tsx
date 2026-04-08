"use client";

import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  locale?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Wordmark PNG includes the name; set true only if you want extra text beside the image */
  showText?: boolean;
  /** Stronger shadow/contrast for light or busy backgrounds (e.g. auth gradients) */
  prominent?: boolean;
  className?: string;
};

/** Responsive display height; width follows 1536×1024 intrinsic aspect ratio */
const sizeClasses = {
  sm: "h-9 w-auto xs:h-10",
  md: "h-10 w-auto xs:h-11 sm:h-12 md:h-14 lg:h-[3.75rem]",
  lg: "h-12 w-auto xs:h-14 sm:h-16 md:h-[4.5rem] lg:h-24",
  xl: "h-[4.25rem] w-auto xs:h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36",
} as const;

const prominentClasses =
  "drop-shadow-[0_2px_10px_rgba(28,25,23,0.14)] contrast-[1.06] brightness-[1.02]";

export function Logo({
  href,
  size = "md",
  showText = false,
  prominent = false,
  className = "",
}: LogoProps) {
  const imgClass = [
    sizeClasses[size],
    "object-contain shrink-0",
    prominent ? prominentClasses : "drop-shadow-sm md:drop-shadow",
    size === "md" || size === "lg" ? "object-left" : "object-center",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Image
        src="/logo.png"
        alt="TeamConect"
        width={1536}
        height={1024}
        className={imgClass}
        sizes="(max-width: 480px) 72vw, (max-width: 768px) 50vw, (max-width: 1024px) 280px, 320px"
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
      <Link href={href} className={wrapperClass} aria-label="TeamConect - Home">
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
