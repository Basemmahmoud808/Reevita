import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CuratedSetCard } from "@/components/collection/curated-set-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getCollectionBySlug } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  if (!result) return { title: "Collection not found", robots: { index: false, follow: false } };

  const { collection, sets } = result;
  const description = `Shop the ${collection.nameEn} by REEVITA: ${sets.length} curated body and hair care sets made for easy gifting and everyday rituals.`;
  return {
    title: `${collection.nameEn} Body & Hair Care Sets`,
    description,
    alternates: { canonical: `${siteUrl}/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.nameEn} | REEVITA Collections`,
      description,
      url: `${siteUrl}/collections/${collection.slug}`,
      images: [{ url: collection.image, alt: `${collection.nameEn} by REEVITA` }],
    },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCollectionBySlug(slug);
  if (!result) notFound();

  const { collection, sets } = result;

  return (
    <main className="container-luxe curated-collection-page">
      <Link href="/collections" className="curated-back-link"><ArrowLeft className="size-4" aria-hidden /> All collections</Link>
      <header className="curated-collection-hero">
        <div className="curated-collection-hero-image" style={{ aspectRatio: collection.coverAspectRatio ?? "3 / 2" }}>
          <Image
            src={collection.image}
            alt={`${collection.nameEn} collection cover`}
            fill
            quality={90}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 42rem"
            className={collection.coverFit === "contain" ? "object-contain" : "object-cover"}
            preload
          />
          <h1 className="sr-only">{collection.nameEn}</h1>
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
          {sets.map((set, index) => (
            <ScrollReveal key={set.id} delayMs={index * 70}>
              <CuratedSetCard set={set} index={index} collectionName={collection.nameEn} collectionSlug={collection.slug} />
            </ScrollReveal>
          ))}
        </div>
      </section>
    </main>
  );
}
