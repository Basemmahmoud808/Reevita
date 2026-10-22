import Link from "next/link";
import { cn } from "@/lib/format";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  href?: string | null;
}

const sizes = {
  sm: { word: "text-[1.45rem]", tag: "text-[0.42rem]" },
  md: { word: "text-[1.9rem]", tag: "text-[0.5rem]" },
  lg: { word: "text-[2.6rem]", tag: "text-[0.6rem]" },
};

export function Logo({ className, variant = "dark", size = "md", withTagline = true, href = "/" }: LogoProps) {
  const palette = variant === "dark" ? "text-plum" : "text-ivory";
  const tagColor = variant === "dark" ? "text-gold-deep" : "text-gold";

  const content = (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span className="flex items-center">
        <span className={cn("latin font-medium tracking-[0.015em]", sizes[size].word, palette)}>
          Reevita
        </span>
      </span>
      {withTagline && (
        <span
          className={cn(
            "eyebrow-plain mt-1.5 ps-[1.15rem] tracking-[0.48em]",
            sizes[size].tag,
            tagColor,
          )}
        >
          COSMETICS
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="REEVITA — Home" className="inline-flex">
      {content}
    </Link>
  );
}
