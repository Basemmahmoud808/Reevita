"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart, type AddableProduct } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Price } from "@/components/ui/price";
import { brand } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";

export function ProductPurchase({ product }: { product: AddableProduct }) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockStatus === "out_of_stock";

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  const waMessage = `Hello REEVITA,\nI would like to order: ${product.nameEn} (${product.size}) x ${quantity}\nProduct link: ${siteUrl}/products/${product.slug}`;

  return (
    <div className="space-y-5">
      <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={10} label="Quantity" />
        <span className="text-xs text-muted">
          {outOfStock ? "Currently unavailable" : product.stockStatus === "low_stock" ? "Limited stock" : "In stock and ready to ship"}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="btn btn-primary flex-1"
        >
          {added ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
          {outOfStock ? "Temporarily out of stock" : added ? "Added to bag" : `Add to bag — ${formatEGP(product.price * quantity)}`}
        </button>
        <Link
          href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(waMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          <MessageCircle className="size-4" aria-hidden />
          Order on WhatsApp
        </Link>
      </div>

      <button
        type="button"
        onClick={openCart}
        className="text-xs font-bold text-muted underline-offset-4 transition-colors hover:text-plum hover:underline"
      >
        View your bag
      </button>
    </div>
  );
}
