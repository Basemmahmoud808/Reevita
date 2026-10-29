"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { GroupedProductCard } from "@/components/product/product-card";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { CartButton } from "@/components/cart/cart-button";
import { blurForSlug } from "@/lib/images";
import { featuredCollections } from "@/lib/catalog";
import { useMemo, useState } from "react";
import type { Collection, Product } from "@/lib/types";

const storyImage = "/images/reevita-story.jpg";

function imageSource(url: string | undefined) {
  if (!url) return null;
  return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://") ? url : `/${url}`;
}

export function ReferenceHome({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const [wishlist, setWishlist] = useState(false);
  const collectionCards = useMemo(
    () => (collections.length > 0 ? collections : featuredCollections).map((collection) => ({
      ...collection,
      products: (collection.productIds ?? [])
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    })),
    [collections, products],
  );
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
              quality={80}
              sizes="100vw"
              className="reference-hero-image object-cover"
            />
            <div className="reference-hero-overlay" aria-hidden="true" />
          </div>
          <div className="reference-container reference-hero-content relative flex items-center">
            <div className="reference-hero-copy relative z-10 max-w-lg">
              <p className="reference-kicker">SKINCARE · HAIRCARE · BEAUTY</p>
              <h1>Natural Beauty<br />for a Healthier You</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#67665d]">
                Premium skincare and haircare products crafted with nature&apos;s finest ingredients.
              </p>
              <div className="reference-hero-actions">
                <a href="#collections" className="reference-button">Shop The Collection <ArrowRight className="size-4" /></a>
                <a href="#story" className="reference-outline-button">Learn More</a>
              </div>
            </div>
            <p className="reference-hero-slogan absolute bottom-7 end-5 max-w-[120px] font-serif text-base italic leading-5 text-[#33423a] md:bottom-10 md:end-8">Real Care.<br />Lasting Beauty.</p>
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

          <div className="reference-collection-grid">
            {collectionCards.map((collection) => {
              const cover = collection.products[0];
              const coverImage = imageSource(cover?.images[0]?.url) ?? imageSource(collection.image);
              const productCount = collection.products.reduce((count, product) => count + (collection.productQuantities?.[product.id] ?? 1), 0);
              return (
                <article key={collection.id} className="reference-home-collection-card group">
                  <Link href={`/collections/${collection.slug}`} className="reference-home-collection-image" aria-label={`Explore ${collection.nameEn}`}>
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={cover?.images[0]?.alt || `${collection.nameEn} product`}
                        fill
                        sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                        placeholder="blur"
                        blurDataURL={blurForSlug(cover?.slug)}
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : <span className="text-sm text-muted">REEVITA</span>}
                    <span className="reference-home-collection-count">{productCount} products</span>
                  </Link>
                  <div className="reference-home-collection-copy">
                    <p className="reference-collection-eyebrow">COLLECTION</p>
                    <h3><Link href={`/collections/${collection.slug}`}>{collection.nameEn}</Link></h3>
                    <p>{collection.descriptionAr}</p>
                    <Link href={`/collections/${collection.slug}`} className="reference-home-collection-link">Explore collection <ArrowRight className="size-4" /></Link>
                  </div>
                </article>
              );
            })}
          </div>
          <Link href="/collections" className="reference-home-all-collections md:hidden">View all collections <ArrowRight className="size-3.5" /></Link>
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
