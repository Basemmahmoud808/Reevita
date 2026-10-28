
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
    .filter((item) => item.slug !== product.slug);

  const accordionItems: AccordionItem[] = [
    {
      title: "Description",
      content: (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.descriptionAr}
        </p>
      ),
    },
    {
      title: "Benefits",
      content:
        product.benefits.length > 0 ? (
          <ul
            dir="rtl"
            lang="ar"
            className="list-disc space-y-2 pe-5 text-start leading-7"
          >
            {product.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        ) : (
          <p>No product benefits are available for this item.</p>
        ),
    },
    {
      title: "Ingredients",
      content: product.ingredientsAr ? (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.ingredientsAr}
        </p>
      ) : (
        <p>Ingredient information is not available for this item.</p>
      ),
    },
    {
      title: "How to use",
      content: product.howToUseAr ? (
        <p dir="rtl" lang="ar" className="text-start leading-7">
          {product.howToUseAr}
        </p>
      ) : (
        <p>Usage information is not available for this item.</p>
      ),
    },
    {
      title: "Customer reviews",
      content:
        product.reviews > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            <Rating
              rating={product.rating}
              reviews={product.reviews}
              size="md"
            />
            <span>Based on verified catalogue review data.</span>
          </div>
        ) : (
          <p>No customer reviews are available for this item yet.</p>
        ),
    },
  ];

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

      <main className="container-luxe w-full min-w-0 overflow-x-clip px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 min-w-0 text-xs text-muted sm:mb-8"
        >
          <ol className="flex min-w-0 flex-wrap items-center gap-2">
            <li className="shrink-0">
              <Link
                href="/"
                className="transition-colors hover:text-gold-deep"
              >
                Home
              </Link>
            </li>

            <li aria-hidden className="shrink-0">
              /
            </li>

            <li className="min-w-0 max-w-full">
              <Link
                href={`/shop?category=${product.categorySlug}`}
                className="break-words transition-colors hover:text-gold-deep"
              >
                {product.categoryNameEn}
              </Link>
            </li>

            <li aria-hidden className="shrink-0">
              /
            </li>

            <li
              className="min-w-0 max-w-full break-words text-plum"
              aria-current="page"
            >
              {product.nameEn}
            </li>
          </ol>
        </nav>

        {/* Product image and information */}
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-7 sm:gap-9 md:gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="w-full min-w-0">
            <ProductGallery
              images={product.images}
              name={product.nameEn}
              slug={product.slug}
            />

            {relatedProducts.length > 0 && (
              <div className="mt-5 rounded-2xl border border-line bg-cream/60 p-3 sm:mt-6 sm:p-4">
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
          </div>

          <section className="w-full min-w-0 lg:pt-2 xl:pt-5">
            <p className="eyebrow">{product.categoryNameEn}</p>

            <h1 className="display-xl mt-3 break-words text-2xl leading-tight sm:text-3xl lg:text-4xl xl:text-5xl">
              {product.nameEn}
            </h1>

            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3 sm:mt-3">
              <Rating
                rating={product.rating}
                reviews={product.reviews}
              />

              <span className="break-words text-sm text-muted">
                {product.size}
              </span>
            </div>

            <p
              dir="rtl"
              lang="ar"
              className="mt-4 break-words text-sm leading-7 text-muted sm:mt-6 sm:text-base sm:leading-8"
            >
              {product.descriptionAr}
            </p>

            <div className="mt-6 w-full min-w-0 sm:mt-7">
              <ProductPurchase product={product} />
            </div>

            <div className="mt-8 min-w-0 sm:mt-9">
              <Accordion items={accordionItems} />
            </div>
          </section>
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
      </main>
    </>
  );
}
