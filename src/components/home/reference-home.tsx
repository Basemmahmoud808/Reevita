"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GroupedProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CuratedCollectionCover } from "@/components/collection/curated-collection-cover";
import { blurForSlug } from "@/lib/images";
import { featuredCollections } from "@/lib/catalog";
import { useMemo } from "react";
import type { Collection, Product } from "@/lib/types";

const storyImage = "/images/reevita-story.jpg";
export function ReferenceHome({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const collectionSlides = useMemo(() => collections.length > 0 ? collections : featuredCollections, [collections]);
  const groupedBestSellers = useMemo(() => {
    const categoryOrder = ["shampoo", "body-lotion", "body-butter", "body-splash", "hair-mist", "shower-gel"];
    return categoryOrder
      .map((categorySlug) => products.filter((product) => product.categorySlug === categorySlug && product.isPrimarySizeOption))
      .filter((variants) => variants.length > 0);
  }, [products]);

  return (
    <div className="reference-home">
      <main>
        <section className="reference-hero">
          <div className="reference-hero-media">
            <Image
              src="/images/reevita-hero.png"
              alt="REEVITA hair mist surrounded by botanical ingredients"
              fill
              preload
              quality={100}
              sizes="(max-width: 639px) 100vw, 100vw"
              className="reference-hero-image object-cover"
            />
            <div className="reference-hero-overlay" aria-hidden="true" />
          </div>
          <div className="reference-container reference-hero-content relative flex">
            <div className="reference-hero-copy relative z-10">
              <p className="reference-kicker">SKINCARE · HAIRCARE · BEAUTY</p>
              <h1>Natural Beauty<br />for a Healthier You</h1>
              <p className="mt-4">
                Premium skincare and haircare products crafted with nature&apos;s finest ingredients.
              </p>
              <div className="reference-hero-actions">
                <a href="#collections" className="reference-button">Shop The Collection <ArrowRight className="size-4" /></a>
                <a href="#story" className="reference-outline-button">Learn More</a>
              </div>
            </div>
          </div>
        </section>

        <ScrollReveal>
        <section id="collections" aria-labelledby="collection-slider-title" className="reference-collection-slider reference-container scroll-mt-20 py-10 md:py-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="reference-kicker">REEVITA COLLECTIONS</p>
              <h2 id="collection-slider-title">Collections</h2>
            </div>
            <Link href="/collections" className="hidden items-center gap-2 text-[0.7rem] md:inline-flex">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {collectionSlides.length > 0 ? (
            <div className="curated-home-grid" aria-label="Curated REEVITA collections">
              {collectionSlides.map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="curated-home-card group">
                  <CuratedCollectionCover image={collection.image} alt={`${collection.nameEn} collection`} aspectRatio={collection.coverAspectRatio} fit={collection.coverFit} sizes="(max-width: 700px) 86vw, (max-width: 1100px) 46vw, 40vw" />
                  <div className="curated-home-card-copy">
                    <span className="reference-collection-eyebrow">{collection.setCount} SETS</span>
                    <span className="curated-home-card-title">{collection.nameEn}</span>
                    <span className="curated-home-card-link">Explore collection <ArrowRight className="size-4" aria-hidden /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="reference-collection-empty">Collections are coming soon.</div>
          )}
        </section>
        </ScrollReveal>

        <ScrollReveal>
        <section id="best-sellers" className="reference-container scroll-mt-20 py-12 md:py-16">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="reference-kicker">OUR COLLECTION</p>
              <h2>Best Sellers</h2>
            </div>
            <Link href="/shop" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.68rem] sm:text-xs">View all products <ArrowRight className="size-3.5" /></Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {groupedBestSellers.map((variants, index) => (
              <ScrollReveal key={variants[0]!.categorySlug} className="h-full" delayMs={index * 55}>
              <div className="reference-product-card">
                <GroupedProductCard products={variants} />
              </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
        </ScrollReveal>

        <ScrollReveal>
        <section id="story" className="reference-container scroll-mt-20 pb-12 md:pb-16">
          <div className="reference-story">
            <div className="reference-story-media">
              <Image src={storyImage} alt="REEVITA Ruby Musk hair mist" fill quality={90} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1200px) 50vw, 38rem" loading="lazy" placeholder="blur" blurDataURL={blurForSlug("story")} className="object-cover" />
            </div>
            <div className="reference-story-copy">
              <p className="reference-kicker">OUR PHILOSOPHY</p>
              <h2 className="mt-3">Skincare<br />That Works</h2>
              <p className="mt-3 text-sm leading-6 text-[#67665d]">Clean, effective, and gentle formulas for your natural glow.</p>
              <a href="#collections" className="reference-outline-button mt-5">Discover REEVITA <ArrowRight className="size-4" /></a>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </main>

    </div>
  );
}
