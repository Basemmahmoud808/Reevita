import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { blurForSlug } from "@/lib/images";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const badge = product.badge ?? (product.isNew ? "جديد" : null);
  const image = product.images[0];

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[1.35rem] bg-cream">
        <Link href={`/products/${product.slug}`} className="block" aria-label={`${product.nameAr} — التفاصيل`}>
          <div className="relative aspect-[4/5] w-full">
            {image && (
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                placeholder="blur"
                blurDataURL={blurForSlug(product.slug)}
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-plum/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
          </div>
        </Link>

        {badge && (
          <span className="absolute top-3.5 end-3.5 inline-flex items-center gap-1 rounded-full bg-plum/90 px-2.5 py-1 text-[0.6rem] font-bold text-ivory backdrop-blur">
            <Sparkles className="size-2.5 text-gold" aria-hidden />
            {badge}
          </span>
        )}

        {product.stockStatus !== "in_stock" && (
          <span className="absolute top-3.5 start-3.5 rounded-full bg-ivory/95 px-2.5 py-1 text-[0.6rem] font-bold text-berry">
            {product.stockStatus === "out_of_stock" ? "نفد المخزون" : "كمية محدودة"}
          </span>
        )}

        <div className="absolute inset-x-3 bottom-3 flex justify-center opacity-100 transition-all duration-300 md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <AddToCartButton product={product} variant="compact" label="أضيفي للسلة" className="w-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.62rem] font-bold tracking-[0.2em] text-gold-deep uppercase">
            {product.categoryNameEn}
          </p>
          <Rating rating={product.rating} reviews={product.reviews} />
        </div>
        <h3 className="mt-2 text-[0.98rem] font-bold leading-7 text-plum">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-gold-deep">
            {product.nameAr}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[0.78rem] leading-6 text-muted">{product.shortAr}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          <span className="text-[0.68rem] font-semibold text-muted">{product.size}</span>
        </div>
      </div>
    </article>
  );
}
