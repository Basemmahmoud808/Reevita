
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { JsonLd } from "@/components/ui/json-ld";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPurchase } from "@/components/product/product-purchase";
import { Rating } from "@/components/ui/rating";
import { brand } from "@/lib/catalog";
import { getProductBySlug, getProductsByCategory } from "@/lib/data/catalog";
import { blurForSlug } from "@/lib/images";
import { siteUrl } from "@/lib/env";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: product.nameEn,
    description: product.shortAr,
    alternates: { canonical: `${siteUrl}/products/${product.slug}` },
    openGraph: {
      title: product.nameEn,
      description: product.shortAr,
      url: `${siteUrl}/products/${product.slug}`,
      type: "website",
      images: product.images[0]?.url
        ? [
            {
              url: product.images[0].url,
              alt: product.images[0].alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = (await getProductsByCategory(product.categorySlug))
    .filter((item) => item.id !== product.id && item.isPrimarySizeOption);

  const accordionItems: AccordionItem[] = [
    {
      title: "Description",
      content: (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.descriptionAr}
        </p>
      ),
    },
  ];
  if (product.benefits.length > 0) {
    accordionItems.push({
      title: "Benefits",
      content: (
          <ul
            dir="rtl"
            lang="ar"
            className="list-disc space-y-2 pe-5 text-start leading-7"
          >
            {product.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        ),
    });
  }
  if (product.ingredientsAr) {
    accordionItems.push({
      title: "Ingredients",
      content: (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.ingredientsAr}
        </p>
      ),
    });
  }
  if (product.howToUseAr) {
    accordionItems.push({
      title: "How to use",
      content: (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.howToUseAr}
        </p>
      ),
    });
  }
  if (product.reviews > 0) {
    accordionItems.push({
      title: "Customer reviews",
      content: (
          <div className="flex flex-wrap items-center gap-3">
            <Rating
              rating={product.rating}
              reviews={product.reviews}
              size="md"
            />
            <span>Based on verified catalogue review data.</span>
          </div>
        ),
    });
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameEn,
    description: product.shortAr,
    sku: product.sku,
    image: product.images.map((image) => image.url),
    brand: { "@type": "Brand", name: "REEVITA" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "EGP",
      price: product.price.toFixed(2),
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
    aggregateRating:
      product.reviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          }
        : undefined,
  };

  return (
    <>
      <JsonLd data={productJsonLd} />

      <main className="product-page-shell">
        <div className="product-page-container">
        {/* Product image and information */}
        <div className="product-detail-card">
          <div className="product-detail-layout">
            <ProductGallery
              images={product.images}
              name={product.nameEn}
              slug={product.slug}
            />

            <section className="product-detail-info">
              <p className="product-detail-kicker">{product.fragranceNameEn || product.categoryNameEn}</p>
              <h1 className="product-detail-title">{product.nameEn}</h1>
              <p className="product-detail-size">{product.size}</p>

              <ProductPurchase product={product} rating={product.rating} reviews={product.reviews} />

              {relatedProducts.length > 0 && (
              <div className="product-scent-options">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">CHOOSE YOUR SCENT</p>
                  <span className="text-[0.68rem] text-muted">{relatedProducts.length + 1} options</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {[product, ...relatedProducts].map((option) => {
                    const image = option.images[0];
                    const isSelected = option.slug === product.slug;

                    return (
                      <Link
                        key={option.slug}
                        href={`/products/${option.slug}`}
                        aria-current={isSelected ? "page" : undefined}
                        className={`group min-w-0 rounded-xl border p-1.5 transition-colors sm:p-2 ${
                          isSelected
                            ? "border-gold-deep bg-ivory"
                            : "border-transparent hover:border-gold/60 hover:bg-ivory"
                        }`}
                      >
                        <span className="relative block aspect-square overflow-hidden rounded-lg bg-ivory">
                          {image?.url && (
                            <Image
                              src={image.url}
                              alt={image.alt || option.nameEn}
                              fill
                              quality={70}
                              sizes="96px"
                              unoptimized={image.url.startsWith("/")}
                              placeholder="blur"
                              blurDataURL={blurForSlug(option.slug)}
                              className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </span>
                        <span className="mt-1.5 block truncate text-center text-[0.66rem] font-semibold text-plum sm:text-xs">
                          {option.variantLabelAr || option.fragranceNameEn || option.nameEn}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
              )}

              <div className="product-detail-accordion">
              <Accordion items={accordionItems} />
              </div>
            </section>
          </div>
        </div>

        {/* Product benefits */}
        {product.benefits.length > 0 && (
          <section
            aria-label="Product benefits"
            className="mt-10 grid min-w-0 grid-cols-1 gap-4 border-y border-line py-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3"
          >
            {product.benefits.slice(0, 3).map((benefit) => (
              <div
                key={benefit}
                className="flex min-w-0 items-start gap-3 px-1 sm:px-2"
              >
                <Check
                  className="mt-1 size-4 shrink-0 text-gold-deep"
                  aria-hidden
                />

                <p
                  dir="rtl"
                  lang="ar"
                  className="min-w-0 break-words text-sm leading-7 text-muted"
                >
                  {benefit}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Store services */}
        <section
          aria-label="REEVITA services"
          className="mt-8 grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-line bg-cream p-4 sm:mt-10 sm:grid-cols-2 sm:p-6 lg:grid-cols-3"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Truck
              className="mt-0.5 size-5 shrink-0 text-gold-deep"
              aria-hidden
            />

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-plum">Shipping</h2>
              <p className="mt-1 break-words text-xs leading-6 text-muted">
                {brand.deliveryEstimateAr}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-gold-deep"
              aria-hidden
            />

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-plum">
                Cash on delivery
              </h2>
              <p className="mt-1 text-xs leading-6 text-muted">
                Pay when your order arrives.
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3">
            <Headphones
              className="mt-0.5 size-5 shrink-0 text-gold-deep"
              aria-hidden
            />

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-plum">
                Customer support
              </h2>
              <p className="mt-1 break-words text-xs leading-6 text-muted">
                {brand.supportPhoneDisplay}
              </p>
            </div>
          </div>
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 min-w-0 border-t border-line pt-8 sm:mt-16 sm:pt-10 md:mt-24 md:pt-14">
            <p className="eyebrow">SAME CATEGORY</p>

            <h2 className="display-md mt-3">
              More from this category
            </h2>

            <ProductGrid
              products={relatedProducts}
              className="mt-6 sm:mt-8"
              prioritizeFirst
              columns={4}
            />
          </section>
        )}
        </div>
      </main>
    </>
  );
}
