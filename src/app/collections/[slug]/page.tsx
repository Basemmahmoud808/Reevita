import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CuratedSetCard } from "@/components/collection/curated-set-card";
import { MetaPixelViewCollection } from "@/components/analytics/meta-pixel-events";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getCuratedSetDiscountPercent } from "@/lib/curated-collections";
import { getCollectionBySlug } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";
import { PROMOTIONAL_DISCOUNTS_ENABLED } from "@/lib/promotions";

export const revalidate = 60;

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

  const { collection, sets, products } = result;
  const setTotals = sets
    .map((set) => {
      const rawTotal = set.components.reduce(
        (sum, component) => sum + (Number(component.product?.price) || 0) * component.quantity,
        0,
      );
      const componentCount = set.components.reduce((sum, component) => sum + component.quantity, 0);
      const discountPercent = PROMOTIONAL_DISCOUNTS_ENABLED
        ? getCuratedSetDiscountPercent(componentCount, collection.slug)
        : 0;
      return rawTotal - Math.round((rawTotal * discountPercent) / 100);
    })
    .filter((total) => total > 0);
  const fallbackProductTotal = products.reduce((sum, product) => sum + (Number(product.price) || 0), 0);
  const collectionValue = setTotals.length > 0 ? Math.min(...setTotals) : fallbackProductTotal;

  return (
    <main className="container-luxe curated-collection-page">
      <MetaPixelViewCollection slug={collection.slug} nameEn={collection.nameEn} setCount={sets.length} value={collectionValue} />
      <Link href="/collections" className="curated-back-link"><ArrowLeft className="size-4" aria-hidden /> All collections</Link>
      <header className="curated-collection-hero curated-collection-hero-text-only">
        <div className="curated-collection-hero-copy">
          <p className="eyebrow">COLLECTION</p>
          <h1>{collection.nameEn}</h1>
          <span className="curated-set-count">{sets.length} sets</span>
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
