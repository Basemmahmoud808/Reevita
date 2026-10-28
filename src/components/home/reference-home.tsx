"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Search } from "lucide-react";
import { GroupedProductCard } from "@/components/product/product-card";
import { CollectionAddToBag } from "@/components/collection/collection-actions";
import { Price } from "@/components/ui/price";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { CartButton } from "@/components/cart/cart-button";
import { blurForSlug } from "@/lib/images";
import { featuredCollections } from "@/lib/catalog";
import { useEffect, useState } from "react";
import { useMemo } from "react";
import type { Collection, Product } from "@/lib/types";

const storyImage = "/images/supplied/Gemini_Generated_Image_b2l3jab2l3jab2l3.jfif";
const collectionSlides = featuredCollections;

export function ReferenceHome({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const [wishlist, setWishlist] = useState(false);
  const [activeCollection, setActiveCollection] = useState(0);
  const [isCollectionPaused, setIsCollectionPaused] = useState(false);
  const slides = useMemo(
    () => (collections.length > 0 ? collections : collectionSlides).map((collection) => ({
      ...collection,
      href: `/collections/${collection.slug}`,
      taglineAr: collection.descriptionAr,
      products: products.filter((product) => collection.productIds?.includes(product.id)),
    })),
    [collections, products],
  );
  const groupedBestSellers = useMemo(() => {
    const categoryOrder = ["shampoo", "body-lotion", "body-butter", "body-splash", "hair-mist", "shower-gel"];
    return categoryOrder
      .map((categorySlug) => products.filter((product) => product.categorySlug === categorySlug && product.isPrimarySizeOption))
      .filter((variants) => variants.length > 0);
  }, [products]);

  useEffect(() => {
    if (isCollectionPaused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveCollection((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isCollectionPaused, slides.length]);

  const selectedCollection = slides[activeCollection] ?? slides[0]!;
  return (
    <div className="reference-home">
      <header className="reference-header">
        <div className="reference-container flex h-[74px] items-center justify-between">
          <Link href="/" className="reference-wordmark">REEVITA</Link>
          <div className="flex items-center gap-4">
            <a href="/shop" aria-label="Search products" className="reference-header-icon hidden sm:inline-flex"><Search className="size-[17px]" /></a>
            <button type="button" aria-label="Wishlist" aria-pressed={wishlist} onClick={() => setWishlist((value) => !value)} className="reference-header-icon hidden sm:inline-flex">
              <Heart className={`size-[17px] ${wishlist ? "fill-current" : ""}`} />
            </button>
            <CartButton className="reference-header-icon" />
          </div>
        </div>
      </header>

      <main>
        <section className="reference-hero">
          <Image
            src="/images/reevita-hero.png"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="reference-hero-image object-cover"
          />
          <div className="reference-hero-overlay" aria-hidden="true" />
          <div className="reference-container relative flex min-h-[480px] items-center py-12 md:min-h-[520px] md:py-0">
            <div className="reference-hero-copy relative z-10 max-w-lg translate-y-4 md:translate-y-7">
              <p className="reference-kicker">SKINCARE · HAIRCARE · BEAUTY</p>
              <h1>Natural Beauty<br />for a Healthier You</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#67665d]">
                Premium skincare and haircare products crafted with nature&apos;s finest ingredients.
              </p>
          <a href="#collections" className="reference-button mt-6">Shop The Collection <ArrowRight className="size-4" /></a>
              <a href="#story" className="reference-outline-button ms-2 mt-6">Learn More</a>
            </div>
            <p className="reference-hero-slogan absolute bottom-7 end-5 max-w-[120px] font-serif text-base italic leading-5 text-[#33423a] md:bottom-10 md:end-8">Real Care.<br />Lasting Beauty.</p>
          </div>
        </section>

        <section
          id="collections"
          aria-labelledby="collection-slider-title"
          className="reference-collection-slider reference-container scroll-mt-20 py-10 md:py-14"
          onMouseEnter={() => setIsCollectionPaused(true)}
          onMouseLeave={() => setIsCollectionPaused(false)}
          onFocus={() => setIsCollectionPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsCollectionPaused(false);
          }}
        >
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="reference-kicker">REEVITA COLLECTIONS</p>
              <h2 id="collection-slider-title">Collections</h2>
            </div>
            <Link href="/collections" className="hidden items-center gap-2 text-[0.7rem] md:inline-flex">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="reference-collection-slide relative overflow-hidden">
            <Image
              key={selectedCollection.slug}
              src={selectedCollection.image}
              alt={`${selectedCollection.nameEn} collection`}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurForSlug(selectedCollection.image.split("/").pop()?.replace(".webp", ""))}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1f3027]/90 via-[#1f3027]/55 to-transparent" aria-hidden />
            <div className="relative z-10 flex min-h-[245px] items-end justify-between gap-5 p-6 md:min-h-[300px] md:p-10">
              <div className="max-w-md text-[#fffdf8]">
                <p className="text-[0.62rem] tracking-[0.2em] text-[#d9bb83]">{selectedCollection.nameEn.toUpperCase()} COLLECTION</p>
                <h3 className="mt-2 font-[var(--font-manrope)] text-3xl font-medium tracking-[-0.04em] text-[#fffdf8] md:text-5xl">
                  {selectedCollection.nameEn}
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-6 text-[#fffdf8]/75 md:text-sm">{selectedCollection.taglineAr}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#fffdf8]/80">
                  <span>{selectedCollection.products.reduce((count, product) => count + (selectedCollection.productQuantities?.[product.id] ?? 1), 0)} products</span>
                  <span aria-hidden>·</span>
                  <Price price={selectedCollection.products.reduce((total, product) => total + product.price * (selectedCollection.productQuantities?.[product.id] ?? 1), 0)} className="text-[#fffdf8]" />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href="/collections" className="reference-outline-button border-[#fffdf8]/60 text-[#fffdf8] hover:border-[#34483d]">
                    Explore collections <ArrowRight className="size-4" />
                  </Link>
                  <CollectionAddToBag purchaseReady={selectedCollection.purchaseReady} products={selectedCollection.products} quantities={selectedCollection.productQuantities} className="border border-[#fffdf8]/60 bg-[#fffdf8] text-[#34483d] hover:bg-[#d9bb83]" />
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 md:flex" aria-label="Collection navigation">
              <button type="button" className="reference-slider-button" aria-label="Previous collection" onClick={() => setActiveCollection((activeCollection - 1 + slides.length) % slides.length)}>
                  <ArrowRight className="size-4 rotate-180" />
                </button>
              <button type="button" className="reference-slider-button" aria-label="Next collection" onClick={() => setActiveCollection((activeCollection + 1) % slides.length)}>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" aria-label="Choose collection">
              {slides.map((fragrance, index) => (
                <button
                  key={fragrance.slug}
                  type="button"
                  aria-label={`Show ${fragrance.nameEn} collection`}
                  aria-current={index === activeCollection}
                  onClick={() => setActiveCollection(index)}
                  className={`reference-slider-dot ${index === activeCollection ? "is-active" : ""}`}
                />
              ))}
            </div>
            <Link href="/collections" className="text-[0.7rem] text-[#77776f] md:hidden">View all collections</Link>
          </div>
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
            <Image src={storyImage} alt="REEVITA care products" fill quality={80} sizes="100vw" loading="lazy" placeholder="blur" blurDataURL={blurForSlug("story")} className="object-cover" />
            <div className="relative z-10 max-w-[330px] px-7 py-10 md:px-12">
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
        <div className="reference-container flex justify-between border-t border-[#ded8cc] py-4 text-[0.6rem] text-[#99958a]"><span>© 2026 REEVITA. All rights reserved.</span><span>Skincare / Haircare / Beauty</span></div>
      </footer>
    </div>
  );
}
