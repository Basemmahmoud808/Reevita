/** User-supplied bundle photos and the catalog products visible in each photo. */
export const curatedCollectionDefinitions = [
  {
    slug: "hair-care-duo-bundle",
    name: "Hair Care Duo bundle",
    coverSetIndex: 3,
    coverFit: "cover",
    sets: [
      { image: "/images/curated-collections/hair-care-duo-bundle/set-01.jpg", aspectRatio: "1 / 1", productSlugs: ["shampoo-dove", "hair-mist-queen"] },
      { image: "/images/curated-collections/hair-care-duo-bundle/set-02.jpg", aspectRatio: "1 / 1", productSlugs: ["shampoo-blueberry", "hair-mist-ruby-musk"] },
      { image: "/images/curated-collections/hair-care-duo-bundle/set-03.jpg", aspectRatio: "1 / 1", productSlugs: ["shampoo-bubble-gum", "hair-mist-sexy"] },
      { image: "/images/curated-collections/hair-care-duo-bundle/set-04.jpg", aspectRatio: "2 / 3", productSlugs: ["shampoo-dove", "hair-mist-queen", "shampoo-blueberry", "hair-mist-ruby-musk", "shampoo-bubble-gum", "hair-mist-sexy"] },
    ],
  },
  {
    slug: "soft-glow-bundle",
    name: "Soft & glow Bundle",
    coverSetIndex: 1,
    coverFit: "cover",
    sets: [
      { image: "/images/curated-collections/soft-glow-bundle/set-01.jpg", aspectRatio: "1 / 1", productSlugs: ["body-lotion-queen", "body-splash-queen", "body-butter-queen"] },
      { image: "/images/curated-collections/soft-glow-bundle/set-02.jpg", aspectRatio: "2 / 3", productSlugs: ["body-lotion-queen", "body-splash-queen", "body-butter-queen", "body-lotion-sexy", "body-splash-sexy", "body-butter-sexy", "body-lotion-ruby-musk", "body-splash-ruby-musk", "body-butter-ruby-musk"] },
      { image: "/images/curated-collections/soft-glow-bundle/set-03.jpg", aspectRatio: "1 / 1", productSlugs: ["body-lotion-ruby-musk", "body-splash-ruby-musk", "body-butter-ruby-musk"] },
      { image: "/images/curated-collections/soft-glow-bundle/set-04.jpg", aspectRatio: "1 / 1", productSlugs: ["body-lotion-sexy", "body-splash-sexy", "body-butter-sexy"] },
    ],
  },
  {
    slug: "complete-care-bundle",
    name: "Complete Care Bundle",
    coverSetIndex: 0,
    coverFit: "contain",
    sets: [
      { image: "/images/curated-collections/complete-care-bundle/set-01.jpg", aspectRatio: "3 / 2", productSlugs: ["shampoo-blueberry", "shower-gel-blueberry", "body-butter-ruby-musk", "body-lotion-ruby-musk", "body-splash-ruby-musk", "hair-mist-ruby-musk"] },
      { image: "/images/curated-collections/complete-care-bundle/set-02.jpg", aspectRatio: "3 / 2", productSlugs: ["shampoo-dove", "shower-gel-dove", "body-butter-queen", "body-lotion-queen", "body-splash-queen", "hair-mist-sexy"] },
      { image: "/images/curated-collections/complete-care-bundle/set-03.jpg", aspectRatio: "3 / 2", productSlugs: ["shampoo-bubble-gum", "shower-gel-bubble-gum", "body-butter-sexy", "body-lotion-sexy", "body-splash-sexy", "hair-mist-sexy"] },
    ],
  },
  {
    slug: "fresh-all-day-bundle",
    name: "Fresh All Day Bundle",
    coverSetIndex: 3,
    coverFit: "cover",
    sets: [
      { image: "/images/curated-collections/fresh-all-day-bundle/set-01.jpg", aspectRatio: "1 / 1", productSlugs: ["shower-gel-dove", "body-lotion-queen", "body-splash-queen"] },
      { image: "/images/curated-collections/fresh-all-day-bundle/set-02.jpg", aspectRatio: "1 / 1", productSlugs: ["shower-gel-bubble-gum", "body-lotion-sexy", "body-splash-sexy"] },
      { image: "/images/curated-collections/fresh-all-day-bundle/set-03.jpg", aspectRatio: "2 / 3", productSlugs: ["shower-gel-blueberry", "body-lotion-ruby-musk", "body-splash-ruby-musk"] },
      { image: "/images/curated-collections/fresh-all-day-bundle/set-04.jpg", aspectRatio: "2 / 3", productSlugs: ["shower-gel-dove", "body-lotion-queen", "body-splash-queen", "shower-gel-bubble-gum", "body-lotion-sexy", "body-splash-sexy", "shower-gel-blueberry", "body-lotion-ruby-musk", "body-splash-ruby-musk"] },
    ],
  },
] as const;

export type CuratedCollectionDefinition = (typeof curatedCollectionDefinitions)[number];

export type CuratedOfferDefinition = {
  offerKey: string;
  kind: "set" | "collection";
  discountPercent: number;
  productSlugs: readonly string[];
};

export function getCuratedSetOfferKey(collectionSlug: string, setNumber: number): string {
  return `${collectionSlug}:set:${setNumber}`;
}

export function getCuratedCollectionOfferKey(collectionSlug: string): string {
  return `${collectionSlug}:collection`;
}

export function getCuratedSetDiscountPercent(productCount: number): number {
  if (productCount === 2) return 11;
  if (productCount >= 3) return 15;
  return 0;
}

/** The cover artwork is for choosing a collection; only the remaining photos are purchasable sets. */
export function getCuratedOfferDefinition(offerKey: string): CuratedOfferDefinition | null {
  for (const collection of curatedCollectionDefinitions) {
    if (offerKey === getCuratedCollectionOfferKey(collection.slug)) {
      const productSlugs = collection.sets
        .filter((_, index) => index !== collection.coverSetIndex)
        .flatMap((set) => set.productSlugs);
      return { offerKey, kind: "collection", discountPercent: 25, productSlugs };
    }

    const match = offerKey.match(new RegExp(`^${collection.slug}:set:(\\d+)$`));
    if (!match) continue;
    const setNumber = Number(match[1]);
    const setIndex = setNumber - 1;
    const set = collection.sets[setIndex];
    if (!set || setIndex === collection.coverSetIndex) return null;
    return {
      offerKey,
      kind: "set",
      discountPercent: getCuratedSetDiscountPercent(set.productSlugs.length),
      productSlugs: set.productSlugs,
    };
  }
  return null;
}
