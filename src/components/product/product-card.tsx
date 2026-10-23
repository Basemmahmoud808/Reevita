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

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const { t, locale } = useI18n();
  const badge = product.badge ? (locale === "en" ? (product.isNew ? t("new") : t("bestseller")) : product.badge) : (product.isNew ? t("new") : null);
  const image = product.images[0];
  const imageSrc = image
    ? image?.url?.startsWith("/") || image?.url?.startsWith("http://") || image?.url?.startsWith("https://")
      ? image?.url
      : `/${image?.url}`
    : null;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[0.75rem] border border-line/70 bg-ivory shadow-card transition-shadow duration-500 group-hover:shadow-luxe">
        <div className="relative aspect-[4/5] w-full bg-ivory p-2 sm:p-3">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={image?.alt ?? product.nameEn}
              fill
              quality={80}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              unoptimized={imageSrc.startsWith("/")}
              placeholder="blur"
              blurDataURL={blurForSlug(product.slug)}
              className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          )}
        </div>

        {badge && (
          <span className="absolute top-3 end-3 border-b border-gold-deep/50 bg-ivory/90 px-1 pb-1 text-[0.58rem] font-bold text-plum">
            {badge}
          </span>
        )}

        {product.stockStatus !== "in_stock" && (
          <span className="absolute top-3 start-3 border-b border-berry/50 bg-ivory/95 px-1 pb-1 text-[0.58rem] font-bold text-berry">
            {product.stockStatus === "out_of_stock" ? t("outOfStock") : t("limitedStock")}
          </span>
        )}

        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center opacity-100 transition-all duration-300 md:pointer-events-none md:translate-y-2 md:opacity-0 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <AddToCartButton product={product} variant="compact" label={t("addToCart")} className="w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-4">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[0.58rem] font-bold tracking-[0.16em] text-muted uppercase">
            {product.categoryNameEn}
          </p>
          <Rating rating={product.rating} reviews={product.reviews} className="shrink-0" />
        </div>
        <h3 className="mt-2 text-[0.98rem] font-bold leading-7 text-plum">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-gold-deep focus-visible:outline-none after:absolute after:inset-0 after:z-[1] after:rounded-[0.75rem] focus-visible:after:ring-2 focus-visible:after:ring-gold-deep focus-visible:after:ring-offset-2"
          >
            {locale === "en" ? product.nameEn : product.nameAr}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.78rem] leading-6 text-muted">
          {locale === "en" ? product.nameEn : product.shortAr}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <span className="whitespace-nowrap text-[0.68rem] font-semibold text-muted">{product.size}</span>
        </div>
      </div>
    </article>
  );
}
