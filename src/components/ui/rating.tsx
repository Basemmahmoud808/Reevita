"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

interface RatingProps {
  rating: number;
  reviews?: number;
  className?: string;
  size?: "sm" | "md";
}

export function Rating({ rating, reviews, className, size = "sm" }: RatingProps) {
  const rounded = Math.round(rating);
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(
              size === "sm" ? "size-3" : "size-3.5",
              index < rounded ? "fill-gold text-gold" : "fill-transparent text-gold/40",
            )}
          />
        ))}
      </span>
      <span className={cn("font-bold text-plum", size === "sm" ? "text-[0.7rem]" : "text-xs")}>
        {rating.toFixed(1)}
      </span>
      {typeof reviews === "number" && (
        <span className="text-[0.7rem] text-muted">({reviews})</span>
      )}
      <span className="sr-only">{t("rating")} {rating.toFixed(1)} out of 5</span>
    </span>
  );
}
