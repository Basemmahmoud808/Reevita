"use client";

import { Plus } from "lucide-react";
import { useCart, type AddableProduct } from "@/components/cart/cart-provider";
import { cn } from "@/lib/format";

export function AddToCartButton({
  product,
  label = "أضيفي للسلة",
  variant = "full",
  className,
}: {
  product: AddableProduct;
  label?: string;
  variant?: "full" | "compact" | "icon";
  className?: string;
}) {
  const { addItem } = useCart();

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => addItem(product)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full bg-ivory/95 text-plum shadow-card backdrop-blur transition-all hover:bg-plum hover:text-ivory",
          className,
        )}
              aria-label={`${label}: ${product.nameAr}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => addItem(product)}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-ivory/95 px-4 py-2.5 text-xs font-bold text-plum shadow-card backdrop-blur transition-all hover:bg-plum hover:text-ivory disabled:opacity-50",
          className,
        )}
        disabled={product.stockStatus === "out_of_stock"}
      aria-label={`${label}: ${product.nameAr}`}
      >
        <Plus className="size-3.5" aria-hidden />
        {product.stockStatus === "out_of_stock" ? "نفد المخزون" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(product)}
      disabled={product.stockStatus === "out_of_stock"}
      className={cn("btn btn-primary w-full", className)}
    >
      {product.stockStatus === "out_of_stock" ? "نفد المخزون مؤقتًا" : label}
      <Plus className="size-4" aria-hidden />
    </button>
  );
}
