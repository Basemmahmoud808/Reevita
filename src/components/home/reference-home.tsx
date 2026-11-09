"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GroupedProductCard } from "@/components/product/product-card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CuratedCollectionCover } from "@/components/collection/curated-collection-cover";
import { blurForSlug } from "@/lib/images";
import { featuredCollections } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import type { Collection, Product } from "@/lib/types";

const heroImage = "/images/reevita-berry-hero.jpg";
const storyImage = "/images/reevita-story.jpg";

export function ReferenceHome({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const { locale } = useI18n();
  const collectionSlides = useMemo(
    () => (collections.length > 0 ? collections : featuredCollections),
    [collections],
  );

  const heroCopy = useMemo(
    () =>
      locale === "ar"
        ? {
            eyebrow: "ريفيتا كوزمتكس",
            title: "لمستك الملكية",
            description: "عناية متكاملة وعطور ساحرة صُممت لأجلك.",
            button: "تسوقي الآن",
            buttonHref: "/shop",
          }
        : {
            eyebrow: "REEVITA COSMETICS",
            title: "Your Royal Touch",
            description: "Beauty essentials made for you.",
            button: "Shop Now",
            buttonHref: "/shop",
          },
    [locale],
  );

  const groupedBestSellers = useMemo(() => {
    const categoryOrder = ["shampoo", "body-lotion", "body-butter", "body-splash", "hair-mist", "shower-gel"];
    return categoryOrder
      .map((categorySlug) => products.filter((product) => product.categorySlug === categorySlug && product.isPrimarySizeOption))
      .filter((variants) => variants.length > 0);
  }, [products]);

  return (
    <div className="reference-home">
      <div>
        <section className="reference-hero">
          <div className="reference-hero-media">
            <Image
              src={heroImage}
              alt="REEVITA Cosmetics complete body and hair care collection"
              fill
              priority
              quality={95}
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
              className="reference-hero-image"
            />
            <div className="reference-hero-content" aria-live="polite">
              <div
                key={locale}
                dir={locale === "ar" ? "rtl" : "ltr"}
                className="reference-hero-copy reference-hero-copy-enter"
              >
                <p className="reference-kicker">{heroCopy.eyebrow}</p>
                <h1>{heroCopy.title}</h1>
                <p className="reference-hero-description">{heroCopy.description}</p>
                <Link href={heroCopy.buttonHref} className="reference-button">
                  {heroCopy.button} <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ScrollReveal>
        <section id="collections" aria-labelledby="collection-slider-title" className="reference-collection-slider reference-container scroll-mt-20 py-10 md:py-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="reference-kicker">{locale === "ar" ? "مجموعات ريفيتا" : "REEVITA COLLECTIONS"}</p>
              <h2 id="collection-slider-title">{locale === "ar" ? "المجموعات" : "Collections"}</h2>
            </div>
            <Link href="/collections" className="hidden items-center gap-2 text-[0.7rem] md:inline-flex">
              {locale === "ar" ? "عرض الكل" : "View all"} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {collectionSlides.length > 0 ? (
            <div className="curated-home-grid" aria-label="Curated REEVITA collections">
              {collectionSlides.map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="curated-home-card group">
                  <CuratedCollectionCover image={collection.image} alt={`${collection.nameEn} collection`} aspectRatio={collection.coverAspectRatio} fit={collection.coverFit} sizes="(max-width: 700px) 86vw, (max-width: 1100px) 46vw, 40vw" />
                  <div className="curated-home-card-copy">
                    <span className="reference-collection-eyebrow">{locale === "ar" ? `${collection.setCount} مجموعات` : `${collection.setCount} SETS`}</span>
                    <span className="curated-home-card-title">{locale === "ar" ? (collection.nameAr || collection.nameEn) : collection.nameEn}</span>
                    <span className="curated-home-card-link">{locale === "ar" ? "اكتشفي المجموعة" : "Explore collection"} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></span>
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
              <p className="reference-kicker">{locale === "ar" ? "مختاراتنا" : "OUR COLLECTION"}</p>
              <h2>{locale === "ar" ? "الأكثر مبيعاً" : "Best Sellers"}</h2>
            </div>
            <Link href="/shop" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.68rem] sm:text-xs">{locale === "ar" ? "عرض كل المنتجات" : "View all products"} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>
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
              <Image src={storyImage} alt="REEVITA Ruby Musk hair mist" fill quality={100} sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1200px) 50vw, 38rem" loading="lazy" placeholder="blur" blurDataURL={blurForSlug("story")} className="object-cover" />
            </div>
            <div className="reference-story-copy">
              <p className="reference-kicker">{locale === "ar" ? "فلسفتنا" : "OUR PHILOSOPHY"}</p>
              <h2 className="mt-3">{locale === "ar" ? <>عناية حقيقية<br />بنتائج ملموسة</> : <>Skincare<br />That Works</>}</h2>
              <p className="mt-3 text-sm leading-6 text-ink/85">{locale === "ar" ? "تركيبات نقية، فعالة ولطيفة لإبراز إشراقتك الطبيعية." : "Clean, effective, and gentle formulas for your natural glow."}</p>
              <a href="#collections" className="reference-outline-button mt-5">{locale === "ar" ? "اكتشفي ريفيتا" : "Discover REEVITA"} <ArrowRight className="size-4 rtl:rotate-180" /></a>
            </div>
          </div>
        </section>
        </ScrollReveal>
      </div>

    </div>
  );
}
