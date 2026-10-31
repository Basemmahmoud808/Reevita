"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Price } from "@/components/ui/price";
import { blurForSlug } from "@/lib/images";
import type { Product } from "@/lib/types";

function imageSource(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://") ? url : `/${url}`;
}

export function CollectionProductGallery({ products, collectionName }: { products: Product[]; collectionName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const { addItem } = useCart();
  const selected = products[activeIndex];
  if (!selected) return null;

  const image = selected.images[0];
  const src = imageSource(image?.url);
  const outOfStock = selected.stockStatus === "out_of_stock";

  function moveSelection(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + products.length) % products.length);
    setAddedProductId(null);
  }

  function addSelectedProduct() {
    if (!selected || outOfStock) return;
    addItem(selected);
    setAddedProductId(selected.id);
    window.setTimeout(() => setAddedProductId((current) => current === selected.id ? null : current), 2200);
  }

  return (
    <section className="collection-product-picker" aria-label={`${collectionName} products`}>
      <div className="collection-product-stage">
        <div className="collection-product-main-image">
          {src ? (
            <Image
              key={`${selected.id}-${src}`}
              src={src}
              alt={image?.alt || selected.nameEn}
              fill
              loading="eager"
              fetchPriority="high"
              quality={85}
              sizes="(max-width: 767px) 100vw, 54vw"
              placeholder="blur"
              blurDataURL={blurForSlug(selected.slug)}
              className="object-contain"
            />
          ) : <span className="text-sm text-muted">Product image coming soon</span>}
          {products.length > 1 ? (
            <div className="collection-product-arrows">
              <button type="button" onClick={() => moveSelection(-1)} aria-label="Previous product"><ArrowLeft className="size-4" /></button>
              <span>{String(activeIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => moveSelection(1)} aria-label="Next product"><ArrowRight className="size-4" /></button>
            </div>
          ) : null}
        </div>

        <div className="collection-product-details">
          <p className="reference-collection-eyebrow">{collectionName.toUpperCase()}</p>
          <p className="collection-product-category">{selected.categoryNameEn}</p>
          <h2 key={selected.id}>{selected.nameEn}</h2>
          <p className="collection-product-size">{selected.size}</p>
          <Price price={selected.price} compareAtPrice={selected.compareAtPrice} size="lg" className="collection-product-price" />
          <p className={`collection-product-stock ${outOfStock ? "is-out" : ""}`}>
            {outOfStock ? "Currently out of stock" : selected.stockStatus === "low_stock" ? "Limited stock" : "In stock and ready to ship"}
          </p>
          <button type="button" onClick={addSelectedProduct} disabled={outOfStock} className="collection-product-add">
            {addedProductId === selected.id ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
            {outOfStock ? "Temporarily out of stock" : addedProductId === selected.id ? "Added to bag" : "Add selected product to bag"}
          </button>
        </div>
      </div>

      {products.length > 1 ? (
        <div className="collection-product-thumbnails" aria-label="Choose a product from this collection">
          {products.map((product, index) => {
            const thumbnail = imageSource(product.images[0]?.url);
            const isSelected = index === activeIndex;
            return (
              <button
                key={product.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => { setActiveIndex(index); setAddedProductId(null); }}
                className={`collection-product-thumbnail ${isSelected ? "is-selected" : ""}`}
              >
                <span className="collection-product-thumbnail-image">
                  {thumbnail ? <Image src={thumbnail} alt="" fill sizes="88px" className="object-contain" /> : null}
                </span>
                <span className="collection-product-thumbnail-copy">
                  <span>{product.nameEn}</span>
                  <span>{product.size}</span>
                </span>
                <span className="collection-product-thumbnail-price"><Price price={product.price} size="sm" /></span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
