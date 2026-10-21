import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  action?: { href: string; label: string };
  className?: string;
  tone?: "dark" | "light";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  action,
  className,
  tone = "dark",
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start",
        action && "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className={cn("eyebrow mb-4", tone === "light" && "text-gold")}>{eyebrow}</p>}
        <h2 className={cn("display-xl", tone === "light" && "text-ivory")}>{title}</h2>
        {description && (
          <p className={cn("lead mt-4", tone === "light" && "text-ivory/70")}>{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 border-b pb-1 text-sm font-bold transition-colors",
            tone === "light"
              ? "border-gold/50 text-ivory hover:text-gold"
              : "border-plum/25 text-plum hover:text-gold-deep",
          )}
        >
          {action.label}
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
        </Link>
      )}
    </Reveal>
  );
}
