import { cn, discountPercent, formatEGP } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg" | "detail";
  className?: string;
  showDiscount?: boolean;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  detail: "text-xl font-medium",
};

export function Price({ price, compareAtPrice, size = "md", className, showDiscount = true }: PriceProps) {
  const discount = discountPercent(price, compareAtPrice);
  const weightClass = size === "detail" ? "font-medium text-ink" : "font-bold text-plum";
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn(weightClass, sizes[size])}>{formatEGP(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-xs font-medium text-muted line-through">{formatEGP(compareAtPrice)}</span>
      )}
      {showDiscount && discount !== null && (
        <span className="rounded-full bg-berry/10 px-2 py-0.5 text-[0.65rem] font-bold text-berry">
          -{discount}%
        </span>
      )}
    </span>
  );
}
