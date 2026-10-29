import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { CuratedSetCard } from "@/components/collection/curated-set-card";
import { getCollectionBySlug } from "@/lib/data/catalog";

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
  const cartSets = sets.map(({ id, components }) => ({ id, components }));

  return (
    <main className="container-luxe curated-collection-page">
      <Link href="/collections" className="curated-back-link"><ArrowLeft className="size-4" aria-hidden /> All collections</Link>
      <header className="curated-collection-hero">
        <div className="curated-collection-hero-image" style={{ aspectRatio: collection.coverAspectRatio ?? "1 / 1" }}>
          <Image
            src={collection.image}
            alt={`${collection.nameEn} collection cover`}
            fill
            priority
            quality={95}
            sizes="(max-width: 700px) 100vw, 92vw"
            className="object-cover"
          />
        </div>
        <div className="curated-collection-hero-copy">
          <p className="eyebrow">REEVITA COLLECTION</p>
          <h1 className="display-xl">{collection.nameEn}</h1>
          <p className="curated-set-count">{sets.length} sets</p>
          <CollectionAddToBag sets={cartSets} label="Add entire collection to cart" />
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
