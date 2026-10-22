"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Search } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { CartButton } from "@/components/cart/cart-button";
import { blurForSlug } from "@/lib/images";
import { useState } from "react";
import type { Product } from "@/lib/types";

const storyImage = "/images/supplied/Gemini_Generated_Image_b2l3jab2l3jab2l3.jfif";

export function ReferenceHome({ products }: { products: Product[] }) {
  const [wishlist, setWishlist] = useState(false);
  return (
    <div className="reference-home">
      <header className="reference-header">
        <div className="reference-container flex h-[74px] items-center justify-between">
          <Link href="/" className="reference-wordmark">REEVITA</Link>
          <div className="flex items-center gap-4">
            <a href="#collection" aria-label="Search products" className="reference-header-icon hidden sm:inline-flex"><Search className="size-[17px]" /></a>
            <button type="button" aria-label="Wishlist" aria-pressed={wishlist} onClick={() => setWishlist((value) => !value)} className="reference-header-icon hidden sm:inline-flex">
              <Heart className={`size-[17px] ${wishlist ? "fill-current" : ""}`} />
            </button>
            <CartButton className="reference-header-icon" />
          </div>
        </div>
      </header>

      <main>
        <section className="reference-hero">
          <div className="reference-container relative flex min-h-[480px] items-center py-12 md:min-h-[520px] md:py-0">
            <div className="reference-hero-copy relative z-10 max-w-lg translate-y-4 md:translate-y-7">
              <p className="reference-kicker">SKINCARE · HAIRCARE · BEAUTY</p>
              <h1>Natural Beauty<br />for a Healthier You</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#67665d]">
                Premium skincare and haircare products crafted with nature&apos;s finest ingredients.
              </p>
              <a href="#collection" className="reference-button mt-6">Shop The Collection <ArrowRight className="size-4" /></a>
              <a href="#story" className="reference-outline-button ms-2 mt-6">Learn More</a>
            </div>
            <p className="reference-hero-slogan absolute bottom-7 end-5 max-w-[120px] font-serif text-base italic leading-5 text-[#33423a] md:bottom-10 md:end-8">Real Care.<br />Lasting Beauty.</p>
          </div>
        </section>

        <section id="collection" className="reference-container scroll-mt-20 py-12 md:py-16">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="reference-kicker">OUR COLLECTION</p>
              <h2>Best Sellers</h2>
            </div>
            <a href="#collection" className="hidden items-center gap-2 text-[0.7rem] md:flex">Explore collection <ArrowRight className="size-3.5" /></a>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {products.map((product, index) => (
              <div key={product.id} className="reference-product-card">
                <ProductCard product={product} priority={index < 4} />
              </div>
            ))}
          </div>
        </section>

        <section id="story" className="reference-container scroll-mt-20 pb-12 md:pb-16">
          <div className="reference-story">
            <Image src={storyImage} alt="REEVITA care products" fill quality={80} sizes="100vw" unoptimized placeholder="blur" blurDataURL={blurForSlug("story")} className="object-cover" />
            <div className="relative z-10 max-w-[330px] px-7 py-10 md:px-12">
              <p className="reference-kicker">OUR PHILOSOPHY</p>
              <h2 className="mt-3">Skincare<br />That Works</h2>
              <p className="mt-3 text-sm leading-6 text-[#67665d]">Clean, effective, and gentle formulas for your natural glow.</p>
                <a href="#collection" className="reference-outline-button mt-5">Discover REEVITA <ArrowRight className="size-4" /></a>
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
