"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/format";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label = "الكمية",
  size = "md",
  className,
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "size-7" : "size-9";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-white/80",
        size === "sm" ? "gap-1 p-0.5" : "gap-2 p-1",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-plum transition-colors hover:bg-cream disabled:opacity-35",
        )}
        aria-label="تقليل الكمية"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className={cn("min-w-6 text-center font-bold text-plum", size === "sm" ? "text-xs" : "text-sm")}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-plum transition-colors hover:bg-cream disabled:opacity-35",
        )}
        aria-label="زيادة الكمية"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
