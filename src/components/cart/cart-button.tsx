"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/format";

export function CartButton({ className }: { className?: string }) {
  const { count, openCart, ready } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        "relative flex size-10 items-center justify-center rounded-full text-plum transition-colors hover:bg-cream",
        className,
      )}
      aria-label={count > 0 ? `سلة المشتريات — ${count} منتج` : "سلة المشتريات"}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -left-0.5 flex size-[18px] items-center justify-center rounded-full bg-wine text-[0.6rem] font-bold text-ivory">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
