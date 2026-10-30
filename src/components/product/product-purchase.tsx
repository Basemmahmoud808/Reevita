"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, ShoppingBag, Star } from "lucide-react";
import { useCart, type AddableProduct } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Price } from "@/components/ui/price";
import { brand } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";

export function ProductPurchase({ product, rating = 0, reviews = 0 }: { product: AddableProduct; rating?: number; reviews?: number }) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState({ baseProductId: product.id, selectedProductId: product.id });
  const [added, setAdded] = useState(false);
  const options = product.sizeOptions.length > 0
    ? product.sizeOptions
    : [{ productId: product.id, slug: product.slug, size: product.size, price: product.price, compareAtPrice: product.compareAtPrice, stockStatus: product.stockStatus }];

  const selectedProductId = selection.baseProductId === product.id ? selection.selectedProductId : product.id;
  const selectedOption = options.find((option) => option.productId === selectedProductId) ?? options[0]!;
  const selectedProduct = {
    ...product,
    id: selectedOption.productId,
    slug: selectedOption.slug,
    size: selectedOption.size,
    price: selectedOption.price,
    compareAtPrice: selectedOption.compareAtPrice,
    stockStatus: selectedOption.stockStatus,
  };
  const outOfStock = selectedProduct.stockStatus === "out_of_stock";

  function handleAdd() {
    addItem(selectedProduct, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  const waMessage = `Hello REEVITA,\nI would like to order: ${product.nameEn} (${selectedProduct.size}) x ${quantity}\nProduct link: ${siteUrl}/products/${product.slug}`;

  return (
    <div className="space-y-5">
      <div className="product-detail-price-row">
        <Price price={selectedProduct.price} compareAtPrice={selectedProduct.compareAtPrice} size="detail" />
        {reviews > 0 && (
          <span className="product-detail-rating" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
            <span>{rating.toFixed(1)}</span>
            <Star className="size-4 fill-current" aria-hidden />
          </span>
        )}
      </div>
      <div className="product-detail-divider" aria-hidden />

      {options.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-plum">Pack size</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.productId}
                type="button"
                aria-pressed={selectedProductId === option.productId}
                onClick={() => setSelection({ baseProductId: product.id, selectedProductId: option.productId })}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${selectedProductId === option.productId ? "border-plum bg-plum text-white" : "border-line bg-white text-plum hover:border-gold-deep"}`}
              >
                {option.size}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} max={10} label="Quantity" />
        <span className="text-xs text-muted">
          {outOfStock ? "Currently unavailable" : selectedProduct.stockStatus === "low_stock" ? "Limited stock" : "In stock and ready to ship"}
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
          {outOfStock ? "Temporarily out of stock" : added ? "Added to bag" : `Add to bag — ${formatEGP(selectedProduct.price * quantity)}`}
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
