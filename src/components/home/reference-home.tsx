"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { GroupedProductCard } from "@/components/product/product-card";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { CartButton } from "@/components/cart/cart-button";
import { CuratedCollectionCover } from "@/components/collection/curated-collection-cover";
import { blurForSlug } from "@/lib/images";
import { featuredCollections } from "@/lib/catalog";
import { useMemo, useState } from "react";
import type { Collection, Product } from "@/lib/types";

const storyImage = "/images/reevita-story.jpg";
export function ReferenceHome({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const [wishlist, setWishlist] = useState(false);
  const collectionSlides = useMemo(() => collections.length > 0 ? collections : featuredCollections, [collections]);
  const groupedBestSellers = useMemo(() => {
    const categoryOrder = ["shampoo", "body-lotion", "body-butter", "body-splash", "hair-mist", "shower-gel"];
    return categoryOrder
      .map((categorySlug) => products.filter((product) => product.categorySlug === categorySlug && product.isPrimarySizeOption))
      .filter((variants) => variants.length > 0);
  }, [products]);

  return (
    <div className="reference-home">
      <header className="reference-header">
        <div className="reference-container flex h-[74px] items-center justify-between">
          <Link href="/" className="reference-wordmark">REEVITA</Link>
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Wishlist" aria-pressed={wishlist} onClick={() => setWishlist((value) => !value)} className="reference-header-icon hidden sm:inline-flex">
              <Heart className={`size-[17px] ${wishlist ? "fill-current" : ""}`} />
            </button>
            <CartButton className="reference-header-icon" />
          </div>
        </div>
      </header>

      <main>
        <section className="reference-hero">
          <div className="reference-hero-media">
            <Image
              src="/images/reevita-hero.png"
              alt="REEVITA hair mist surrounded by botanical ingredients"
              fill
              priority
              quality={90}
              sizes="100vw"
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
                  <CuratedCollectionCover image={collection.image} alt={`${collection.nameEn} collection`} aspectRatio={collection.coverAspectRatio} sizes="(max-width: 700px) 86vw, (max-width: 1100px) 46vw, 40vw" />
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

        <section id="best-sellers" className="reference-container scroll-mt-20 py-12 md:py-16">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="reference-kicker">OUR COLLECTION</p>
              <h2>Best Sellers</h2>
            </div>
            <Link href="/shop" className="hidden items-center gap-2 text-[0.7rem] md:flex">Explore all products <ArrowRight className="size-3.5" /></Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {groupedBestSellers.map((variants, index) => (
              <div key={variants[0]!.categorySlug} className="reference-product-card">
                <GroupedProductCard products={variants} priority={index < 4} />
              </div>
            ))}
          </div>
        </section>

        <section id="story" className="reference-container scroll-mt-20 pb-12 md:pb-16">
          <div className="reference-story">
            <div className="reference-story-media">
              <Image src={storyImage} alt="REEVITA Ruby Musk hair mist" fill quality={80} sizes="(max-width: 767px) 38vw, 50vw" loading="lazy" placeholder="blur" blurDataURL={blurForSlug("story")} className="object-cover" />
            </div>
            <div className="reference-story-copy">
              <p className="reference-kicker">OUR PHILOSOPHY</p>
              <h2 className="mt-3">Skincare<br />That Works</h2>
              <p className="mt-3 text-sm leading-6 text-[#67665d]">Clean, effective, and gentle formulas for your natural glow.</p>
              <a href="#collections" className="reference-outline-button mt-5">Discover REEVITA <ArrowRight className="size-4" /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="reference-footer">
        <div className="reference-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          <div>
            <p className="reference-wordmark">REEVITA</p>
            <p className="mt-2 text-xs text-[#77766e]">Pure Care. Lasting Beauty.</p>
            <SocialIconLinks className="mt-4" />
          </div>
          <div><p className="reference-footer-title">Quick Links</p><div className="mt-3 space-y-2 text-xs text-[#77766e]"><Link className="block" href="/">Home</Link><Link className="block" href="/checkout">Checkout</Link></div></div>
          <div><p className="reference-footer-title">Customer Care</p><div className="mt-3 space-y-2 text-xs text-[#77766e]"><Link className="block" href="/checkout">Complete your order</Link></div></div>
        </div>
        <div className="reference-container flex justify-between border-t border-[#ded8cc] py-4 text-[0.6rem] text-[#99958a]"><span>© 2026 REEVITA. All rights reserved.</span><a href="https://www.facebook.com/share/1CWMusi43s/" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#34483d]">Powered by Basem</a></div>
      </footer>
    </div>
  );
}
