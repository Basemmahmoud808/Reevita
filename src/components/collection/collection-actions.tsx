"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";

export function CollectionAddToBag({ products, quantities = {}, purchaseReady = true, className }: { products: Product[]; quantities?: Record<string, number>; purchaseReady?: boolean; className?: string }) {
  const { addItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const available = products.filter((product) => product.stockStatus !== "out_of_stock");
  const disabled = !purchaseReady || available.length === 0 || isAdding;
  const handleAdd = () => {
    if (disabled) return;
    setIsAdding(true);
    const bundleItems = available.flatMap((product) =>
      Array.from({ length: Math.max(1, quantities[product.id] ?? 1) }, () => product),
    );
    addItems(bundleItems);
    window.setTimeout(() => setIsAdding(false), 700);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleAdd}
      className={cn("btn btn-primary inline-flex gap-2 px-4 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-50", className)}
    >
      <ShoppingBag className="size-3.5" aria-hidden />
      {!purchaseReady ? "Bundle setup pending" : disabled ? "Unavailable" : "Add Collection to Bag"}
    </button>
  );
}
