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

  const waMessage = `أهلًا ريفيتا 👋\nأريد طلب: ${product.nameAr} (${product.size}) × ${quantity}\nرابط المنتج: ${siteUrl}/products/${product.slug}`;

  return (
    <div className="space-y-5">
      <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={10} label="كمية المنتج" />
        <span className="text-xs text-muted">
          {outOfStock ? "غير متوفر حاليًا" : product.stockStatus === "low_stock" ? "كمية محدودة" : "متوفر وجاهز للشحن"}
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
          {outOfStock ? "نفد المخزون مؤقتًا" : added ? "تمت الإضافة" : `أضيفي للسلة — ${formatEGP(product.price * quantity)}`}
        </button>
        <Link
          href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(waMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          <MessageCircle className="size-4" aria-hidden />
          اطلبي واتساب
        </Link>
      </div>

      <button
        type="button"
        onClick={openCart}
        className="text-xs font-bold text-muted underline-offset-4 transition-colors hover:text-plum hover:underline"
      >
        استعراض السلة الحالية
      </button>
    </div>
  );
}
