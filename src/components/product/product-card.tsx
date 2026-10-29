"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { blurForSlug } from "@/lib/images";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

function productImage(product: Product) {
  const image = product.images[0];
  const imageSrc = image?.url?.startsWith("/") || image?.url?.startsWith("http://") || image?.url?.startsWith("https://")
    ? image.url
    : image?.url
      ? `/${image.url}`
      : null;
  return { image, imageSrc };
}

function ProductBadge({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const badge = product.badge
    ? locale === "en"
      ? product.isNew ? t("new") : t("bestseller")
      : product.badge
    : product.isNew
      ? t("new")
      : null;

  return (
    <>
      {badge && <span className="absolute top-3 end-3 z-[2] border-b border-gold-deep/50 bg-ivory/90 px-1 pb-1 text-[0.58rem] font-bold text-plum">{badge}</span>}
      {product.stockStatus !== "in_stock" && (
        <span className="absolute top-3 start-3 z-[2] border-b border-berry/50 bg-ivory/95 px-1 pb-1 text-[0.58rem] font-bold text-berry">
          {product.stockStatus === "out_of_stock" ? t("outOfStock") : t("limitedStock")}
        </span>
      )}
    </>
  );
}

function ProductImage({ product, priority }: { product: Product; priority: boolean }) {
  const { image, imageSrc } = productImage(product);
  return (
    <div className="relative aspect-[4/5] w-full bg-ivory p-2 sm:p-3">
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={image?.alt ?? product.nameEn}
          fill
          quality={80}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          placeholder="blur"
          blurDataURL={blurForSlug(product.slug)}
          className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      )}
    </div>
  );
}

export function ProductCard({ product, priority = false, className, groupName }: { product: Product; priority?: boolean; className?: string; groupName?: string }) {
  const { t, locale } = useI18n();

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[0.75rem] border border-line/70 bg-ivory shadow-card transition-shadow duration-500 group-hover:shadow-luxe">
        <ProductImage product={product} priority={priority} />
        <ProductBadge product={product} />
        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center opacity-100 transition-all duration-300 md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <AddToCartButton product={product} variant="compact" label={t("addToCart")} className="w-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.58rem] font-bold tracking-[0.16em] text-muted uppercase">{groupName ?? product.categoryNameEn}</p>
          {product.reviews > 0 && <Rating rating={product.rating} reviews={product.reviews} />}
        </div>
        <h3 className="mt-2 text-[0.98rem] font-bold leading-7 text-plum">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2">
            {locale === "en" ? product.nameEn : product.nameAr}
          </Link>
        </h3>
        {locale === "ar" && product.shortAr && <p className="mt-1 line-clamp-2 text-[0.78rem] leading-6 text-muted">{product.shortAr}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <span className="whitespace-nowrap text-[0.68rem] font-semibold text-muted">{product.size}</span>
        </div>
      </div>
    </article>
  );
}

/** One Best Sellers card per product type; all fragrance selection remains on the detail page. */
export function GroupedProductCard({ products, priority = false, className }: { products: Product[]; priority?: boolean; className?: string }) {
  const { t, locale } = useI18n();
  const product = products[0];
  if (!product) return null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[0.75rem] border border-line/70 bg-ivory shadow-card transition-shadow duration-500 group-hover:shadow-luxe">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.nameEn}`} className="absolute inset-0 z-[1] rounded-[0.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2" />
        <ProductImage product={product} priority={priority} />
        <ProductBadge product={product} />
        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center opacity-100 transition-all duration-300 md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100" onClick={(event) => event.stopPropagation()}>
          <AddToCartButton product={product} variant="compact" label={t("addToCart")} className="w-full" />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col px-0.5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.58rem] font-bold tracking-[0.16em] text-muted uppercase">{product.categoryNameEn}</p>
          {product.reviews > 0 && <Rating rating={product.rating} reviews={product.reviews} />}
        </div>
        <h3 className="mt-2 text-[0.98rem] font-bold leading-7 text-plum">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2">
            {locale === "en" ? `REEVITA ${product.categoryNameEn}` : product.categoryNameAr}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <span className="whitespace-nowrap text-[0.68rem] font-semibold text-muted">{product.size}</span>
        </div>
      </div>
    </article>
  );
}
