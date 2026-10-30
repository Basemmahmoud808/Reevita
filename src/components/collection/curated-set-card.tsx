"use client";

import Image from "next/image";
import { Price } from "@/components/ui/price";
import { CollectionAddToBag, type PurchasableCollectionSet } from "@/components/collection/collection-actions";
import { getCuratedSetDiscountPercent } from "@/lib/curated-collections";
import { formatEGP } from "@/lib/format";

export function CuratedSetCard({ set, index, collectionName }: { set: PurchasableCollectionSet & { image: string; aspectRatio: string }; index: number; collectionName: string }) {
  const total = set.components.reduce((sum, component) => sum + (component.product?.price ?? 0) * component.quantity, 0);
  const componentCount = set.components.reduce((sum, component) => sum + component.quantity, 0);
  const discountPercent = getCuratedSetDiscountPercent(componentCount);
  const discountedTotal = total - Math.round(total * discountPercent / 100);

  return (
    <article className="curated-set-card">
      <div className="curated-set-image" style={{ aspectRatio: set.aspectRatio }}>
        <Image
          src={set.image}
          alt={`${collectionName}, set ${index + 1}`}
          fill
          quality={90}
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 31vw"
          className="object-cover"
        />
        <span className="curated-set-number">SET {String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="curated-set-content">
        <h2>Set {String(index + 1).padStart(2, "0")}</h2>
        <ul className="curated-set-components">
          {set.components.map((component, componentIndex) => (
            <li key={`${component.slug}-${componentIndex}`}>
              {component.product ? (
                <>
                  <span>
                    {component.product.nameEn}
                    {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                  </span>
                  <span>{component.product.size}</span>
                </>
              ) : (
                <span>Catalog product missing: {component.slug}</span>
              )}
            </li>
          ))}
        </ul>
        <div className="curated-set-footer">
          <div>
            <span className="curated-total-label">Set total</span>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Price price={discountedTotal} size="lg" showDiscount={false} />
              <span className="text-xs text-muted line-through">{formatEGP(total)}</span>
              <span className="rounded-full bg-gold/20 px-2 py-1 text-[0.65rem] font-bold text-plum">Save {discountPercent}%</span>
            </div>
          </div>
          <CollectionAddToBag sets={[set]} label="Add set to cart" offerKey={set.offerKey} discountPercent={discountPercent} />
        </div>
      </div>
    </article>
  );
}
