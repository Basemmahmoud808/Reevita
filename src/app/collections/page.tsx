import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CuratedCollectionCover } from "@/components/collection/curated-collection-cover";
import { getCollections } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "REEVITA collections.",
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
            return (
              <article key={collection.id} className="card-luxe curated-collection-list-card group flex h-full flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                <Link href={`/collections/${collection.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-inset">
                  <CuratedCollectionCover image={collection.image} alt={`${collection.nameEn} collection`} aspectRatio={collection.coverAspectRatio} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw" />
                </Link>
                <div className="curated-collection-list-card-body flex flex-1 flex-col">
                  <p className="eyebrow">COLLECTION</p>
                  <h2 className="curated-collection-list-title display-md">{collection.nameEn}</h2>
                  <div className="curated-collection-list-count mt-auto flex flex-wrap items-center justify-between gap-2">
                    <span>{setCount} sets</span>
                  </div>
                  <div className="curated-collection-list-action flex min-h-10 flex-col items-start gap-3">
                    <Link href={`/collections/${collection.slug}`} className="inline-flex flex-wrap items-center gap-2 font-bold text-plum group-hover:text-gold-deep">
                      Explore collection <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card-luxe px-6 py-12 text-center text-sm text-muted">Collections will be available soon.</div>
      )}
    </main>
  );
}
