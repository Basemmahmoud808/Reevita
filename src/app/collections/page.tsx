import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CuratedCollectionCover } from "@/components/collection/curated-collection-cover";
import { getCollectionDiscountPercent } from "@/lib/curated-collections";
import { getCollections } from "@/lib/data/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Curated Body & Hair Care Gift Collections",
  description: "Discover curated REEVITA body and hair care sets, thoughtfully paired for gifting, daily rituals and signature scents.",
  alternates: { canonical: "/collections" },
};

const merchandisingCollectionOrder = [
  "hair-care-duo-bundle",
  "soft-glow-bundle",
  "complete-care-bundle",
  "fresh-all-day-bundle",
];

export default async function CollectionsPage() {
  const allCollections = await getCollections();
  const rank = new Map(merchandisingCollectionOrder.map((slug, index) => [slug, index]));
  const collections = allCollections
    .filter((collection) => rank.has(collection.slug))
    .sort((a, b) => (rank.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.slug) ?? Number.MAX_SAFE_INTEGER));

  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">REEVITA COLLECTIONS</p>
        <h1 className="display-xl mt-3">Collections</h1>
      </div>
      {collections.length > 0 ? (
        <div className="curated-collection-list-grid">
          {collections.map((collection) => {
            const setCount = collection.setCount ?? 0;
            const discountPercent = getCollectionDiscountPercent(collection.slug);
            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="curated-collection-list-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
              >
                <CuratedCollectionCover
                  image={collection.image}
                  alt={`${collection.nameEn} collection`}
                  aspectRatio={collection.coverAspectRatio}
                  fit={collection.coverFit}
                  sizes="(max-width: 768px) 86vw, (max-width: 1200px) 46vw, 25vw"
                />
                <span className="curated-card-shine" aria-hidden="true" />
                <div className="curated-card-badge">
                  <span>{setCount} SETS</span>
                  {discountPercent > 0 && (
                    <>
                      <span className="curated-card-badge-dot" aria-hidden="true">•</span>
                      <span className="curated-card-badge-accent">SAVE {discountPercent}%</span>
                    </>
                  )}
                </div>
                <div className="curated-collection-list-card-body">
                  <h2 className="curated-collection-list-title">{collection.nameEn}</h2>
                  <span className="curated-home-card-link">
                    <span>Explore collection</span>
                    <ArrowRight className="curated-card-arrow size-4 rtl:rotate-180" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card-luxe px-6 py-12 text-center text-sm text-muted">Collections will be available soon.</div>
      )}
    </main>
  );
}
