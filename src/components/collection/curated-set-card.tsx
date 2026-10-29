"use client";

import Image from "next/image";
import { Price } from "@/components/ui/price";
import { CollectionAddToBag, type PurchasableCollectionSet } from "@/components/collection/collection-actions";

export function CuratedSetCard({ set, index, collectionName }: { set: PurchasableCollectionSet & { image: string; aspectRatio: string }; index: number; collectionName: string }) {
  const total = set.components.reduce((sum, component) => sum + (component.product?.price ?? 0) * component.quantity, 0);

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
            <Price price={total} size="lg" />
          </div>
          <CollectionAddToBag sets={[set]} label="Add set to cart" />
        </div>
      </div>
    </article>
  );
}
