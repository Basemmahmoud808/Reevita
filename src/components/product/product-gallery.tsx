"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/format";
import { blurForSlug } from "@/lib/images";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  name,
  slug,
  priority = true,
}: {
  images: ProductImage[];
  name: string;
  slug: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);
  const gallery = images.length > 0 ? images : [{ url: "", alt: name }];
  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="grid gap-3 md:grid-cols-[84px_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
        {gallery.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`عرض صورة ${index + 1} — ${name}`}
            aria-current={active === index ? "true" : undefined}
            className={cn(
              "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-cream transition-all md:h-24 md:w-full",
              active === index ? "border-gold" : "border-transparent opacity-75 hover:opacity-100",
            )}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="96px"
              placeholder="blur"
              blurDataURL={blurForSlug(slug)}
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-line bg-cream">
          {current?.url && (
            <Image
              key={current.url}
              src={current.url}
              alt={current.alt || name}
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 45vw"
              placeholder="blur"
              blurDataURL={blurForSlug(slug)}
              className="object-cover animate-fade"
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-plum/5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
