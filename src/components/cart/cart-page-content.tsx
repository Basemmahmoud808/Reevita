"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatEGP } from "@/lib/format";

export function CartPageContent() {
  const { lines, subtotal, bundleDiscountAmount, volumeDiscountAmount, volumeDiscountPercent, subtotalAfterDiscount, count, freeShippingRemaining, freeShippingThreshold, ready } = useCart();

  if (!ready) {
    return (
      <div className="container-luxe py-20">
        <div className="skeleton h-8 w-48 rounded-full" />
        <div className="skeleton mt-8 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center py-20 text-center md:py-28">
        <span className="flex size-20 items-center justify-center rounded-full bg-cream">
          <ShoppingBag className="size-8 text-gold-deep" aria-hidden />
        </span>
        <h1 className="display-xl mt-6">Your bag is empty</h1>
        <p className="lead mt-3 max-w-md">
          You have not added any products yet. Explore REEVITA and begin your daily ritual.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Shop now
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <Link href="/collections" className="btn btn-outline">
            Explore scents
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">YOUR RITUAL</p>
          <h1 className="display-xl mt-3">Shopping bag</h1>
          <p className="mt-2 text-sm text-muted">{count} items in your bag</p>
        </div>
        <Link href="/" className="text-sm font-bold text-plum transition-colors hover:text-gold-deep">
          Continue shopping →
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-line bg-white/60 px-5 sm:px-7">
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-card">
            <h2 className="display-md text-xl">Order summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-bold text-plum">{formatEGP(subtotal)}</dd>
              </div>
              {volumeDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-800">
                  <dt>Multi-buy discount ({volumeDiscountPercent}%)</dt>
                  <dd className="font-bold">−{formatEGP(volumeDiscountAmount)}</dd>
                </div>
              )}
              {bundleDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-800">
                  <dt>Bundle savings</dt>
                  <dd className="font-bold">−{formatEGP(bundleDiscountAmount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-semibold text-plum">
                  {freeShippingRemaining === 0 ? "Free" : "Calculated at checkout"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-bold text-plum">Estimated total</dt>
                <dd className="text-lg font-bold text-plum">{formatEGP(subtotalAfterDiscount)}</dd>
              </div>
            </dl>

            {freeShippingRemaining > 0 ? (
              <div className="mt-5 rounded-xl bg-cream/70 p-3.5">
                <p className="flex items-center gap-2 text-[0.72rem] font-bold text-plum">
                  <Truck className="size-4 text-gold-deep" aria-hidden />
                  Add {formatEGP(freeShippingRemaining)} for free shipping
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-gold/10 p-3.5 text-[0.72rem] font-bold text-gold-deep">
                <Truck className="size-4" aria-hidden />
                Your order qualifies for free shipping
              </p>
            )}

            <Link href="/checkout" className="btn btn-primary mt-5 w-full">
              Checkout
              <ArrowLeft className="size-4" aria-hidden />
            </Link>

            <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-[0.7rem] text-muted">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-gold-deep" aria-hidden />
                Cash on delivery — no upfront payment
              </p>
              <p className="flex items-center gap-2">
                <Truck className="size-3.5 text-gold-deep" aria-hidden />
                Fast shipping across Egypt
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
