"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { formatEGP } from "@/lib/format";
import { blurForSlug } from "@/lib/images";
import type { CartLine } from "@/lib/types";

export function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { setQuantity, removeItem, closeCart } = useCart();

  return (
    <li className="flex gap-3.5 py-4">
      <Link
        href={`/products/${line.slug}`}
        onClick={closeCart}
        className="relative block h-[104px] w-20 shrink-0 overflow-hidden rounded-xl bg-cream"
      >
        <Image
          src={line.image}
          alt={line.nameAr}
          fill
          quality={70}
          sizes="80px"
          placeholder="blur"
          blurDataURL={blurForSlug(line.slug)}
          className="object-cover"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${line.slug}`}
              onClick={closeCart}
              className="line-clamp-2 text-sm font-bold text-plum transition-colors hover:text-gold-deep"
            >
              {line.nameAr}
            </Link>
            <p className="mt-1 text-[0.7rem] text-muted">
              {line.variantLabelAr ? `${line.variantLabelAr} · ` : ""}
              {line.size}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(line.productId)}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            aria-label={`إزالة ${line.nameAr} من السلة`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <QuantityStepper
            value={line.quantity}
            onChange={(quantity) => setQuantity(line.productId, quantity)}
            max={line.maxQuantity}
            size={compact ? "sm" : "md"}
          />
          <span className="text-sm font-bold text-plum">{formatEGP(line.price * line.quantity)}</span>
        </div>
      </div>
    </li>
  );
}
