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
    <div className="product-gallery">
      <div className="product-gallery-main">
        {current?.url && (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt || name}
            fill
            priority={priority}
            quality={85}
            sizes="(max-width: 1023px) 100vw, 55vw"
            unoptimized={current.url.startsWith("/")}
            placeholder="blur"
            blurDataURL={blurForSlug(slug)}
            className="product-gallery-main-image"
          />
        )}
      </div>

      <div className="product-gallery-thumbnails" role="group" aria-label="Product images">
        {gallery.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`View product image ${index + 1} — ${name}`}
            aria-current={active === index ? "true" : undefined}
            className={cn(
              "product-gallery-thumbnail",
              active === index ? "is-active" : "",
            )}
          >
            <span className="product-gallery-thumbnail-image">
              <Image
                src={image.url}
                alt=""
                fill
                quality={60}
                sizes="70px"
                unoptimized={image.url.startsWith("/")}
                placeholder="blur"
                blurDataURL={blurForSlug(slug)}
                className="object-cover"
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
