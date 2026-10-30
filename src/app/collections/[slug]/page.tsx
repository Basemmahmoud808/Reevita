import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { CuratedSetCard } from "@/components/collection/curated-set-card";
import { getCollectionBySlug } from "@/lib/data/catalog";
import { getCuratedCollectionOfferKey } from "@/lib/curated-collections";
import { formatEGP } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  return result ? { title: result.collection.nameEn } : {};
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  if (!result) notFound();

  const { collection, sets } = result;
  const cartSets = sets.map(({ id, offerKey, components }) => ({ id, offerKey, components }));
  const collectionTotal = sets.reduce(
    (sum, set) => sum + set.components.reduce((setSum, component) => setSum + (component.product?.price ?? 0) * component.quantity, 0),
    0,
  );
  const collectionDiscountedTotal = collectionTotal - Math.round(collectionTotal * 0.25);

  return (
    <main className="container-luxe curated-collection-page">
      <Link href="/collections" className="curated-back-link"><ArrowLeft className="size-4" aria-hidden /> All collections</Link>
      <header className="curated-collection-hero curated-collection-hero-text-only">
        <div className="curated-collection-hero-copy">
          <p className="eyebrow">REEVITA COLLECTION</p>
          <h1 className="display-xl">{collection.nameEn}</h1>
          <p className="curated-set-count">{sets.length} sets</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-bold text-plum">{formatEGP(collectionDiscountedTotal)}</span>
            <span className="text-sm text-muted line-through">{formatEGP(collectionTotal)}</span>
            <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-plum">Save 25%</span>
          </div>
          <CollectionAddToBag sets={cartSets} label="Add entire collection to cart" offerKey={getCuratedCollectionOfferKey(collection.slug)} discountPercent={25} />
        </div>
      </header>

      <section className="curated-sets-section" aria-label={`${collection.nameEn} sets`}>
        <div className="curated-sets-heading">
          <div>
            <p className="eyebrow">CHOOSE YOUR SET</p>
            <h2 className="display-md">Sets in this collection</h2>
          </div>
          <span>{sets.length} sets</span>
        </div>
        <div className="curated-sets-grid">
          {sets.map((set, index) => <CuratedSetCard key={set.id} set={set} index={index} collectionName={collection.nameEn} />)}
        </div>
      </section>
    </main>
  );
}
