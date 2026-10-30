"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";

export interface PurchasableCollectionComponent {
  slug: string;
  product: Product | null;
  quantity: number;
}

export interface PurchasableCollectionSet {
  id: string;
  offerKey: string;
  components: PurchasableCollectionComponent[];
}

export function CollectionAddToBag({ sets, label, offerKey, discountPercent, className }: { sets: PurchasableCollectionSet[]; label: string; offerKey: string; discountPercent: number; className?: string }) {
  const { addCuratedItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const components = sets.flatMap((set) => set.components);
  const missing = components.filter((component) => !component.product);
  const outOfStock = components.filter((component) => component.product?.stockStatus === "out_of_stock");
  const blockers = [...new Set([
    ...missing.map((component) => `Missing catalog product: ${component.slug}`),
    ...outOfStock.map((component) => `${component.product!.nameEn} (${component.product!.size})`),
  ])];
  const disabled = components.length === 0 || blockers.length > 0 || isAdding;

  const handleAdd = () => {
    if (disabled) return;
    setIsAdding(true);
    const products = components.flatMap((component) =>
      Array.from({ length: component.quantity }, () => component.product!),
    );
    addCuratedItems(products, offerKey);
    window.setTimeout(() => setIsAdding(false), 700);
  };

  return (
    <div className="curated-add-wrap">
      <button
        type="button"
        disabled={disabled}
        onClick={handleAdd}
        className={cn("btn btn-primary inline-flex gap-2 px-4 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-55", className)}
      >
        <ShoppingBag className="size-4" aria-hidden />
        {isAdding ? "Adding to cart…" : disabled ? `${label} unavailable` : `${label} · ${discountPercent}% off`}
      </button>
      {blockers.length > 0 ? <p className="curated-unavailable-copy">Unavailable: {blockers.join(", ")}</p> : null}
    </div>
  );
}
