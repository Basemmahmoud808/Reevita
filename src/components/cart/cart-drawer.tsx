"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatEGP } from "@/lib/format";
import { cn } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    lines,
    count,
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    freeShippingRemaining,
    freeShippingThreshold,
  } = useCart();

  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const qualified = freeShippingRemaining === 0;
  const { t } = useI18n();

  return (
    <div
      className={cn("fixed inset-0 z-[110]", isOpen ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        onClick={closeCart}
        className={cn(
          "absolute inset-0 h-full w-full bg-plum-deep/50 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        aria-label={t("closeMenu")}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("cart")}
        inert={!isOpen}
        className={cn(
          "absolute inset-y-0 left-0 flex w-full max-w-[440px] flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-5">
          <div>
            <p className="eyebrow-plain text-[0.6rem] text-gold-deep">YOUR RITUAL</p>
            <h2 className="display-md mt-1 flex items-center gap-2">
              <ShoppingBag className="size-5 text-gold-deep" aria-hidden />
              {t("cart")}
              <span className="text-sm font-normal text-muted">({count})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full border border-line p-2 text-plum transition-colors hover:bg-cream"
            aria-label={t("closeMenu")}
            tabIndex={isOpen ? 0 : -1}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {lines.length > 0 && (
          <div className="border-b border-line bg-cream/60 px-5 py-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-plum">
              <Truck className="size-4 text-gold-deep" aria-hidden />
              {qualified ? (
                <span>Free shipping unlocked</span>
              ) : (
                <span>
                  Add <span className="text-gold-deep">{formatEGP(freeShippingRemaining)}</span> for free
                  shipping
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-cream">
                <ShoppingBag className="size-7 text-gold-deep" aria-hidden />
              </span>
              <p className="display-md text-lg">Your bag is empty</p>
              <p className="max-w-xs text-sm text-muted">
                Start your ritual by choosing a favourite from the REEVITA collection.
              </p>
              <Link href="/" onClick={closeCart} className="btn btn-primary mt-2">
                Back to home
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <CartLineItem key={line.productId} line={line} compact />
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="border-t border-line bg-white/70 px-5 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="text-lg font-bold text-plum">{formatEGP(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm text-emerald-800">
                <span>Bundle savings</span>
                <span className="font-bold">−{formatEGP(discountAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
                <span className="font-bold text-plum">After discount</span>
                <span className="font-bold text-plum">{formatEGP(subtotalAfterDiscount)}</span>
              </div>
            )}
            <p className="mt-1 text-[0.7rem] text-muted">
              Shipping and cash on delivery are calculated at checkout.
            </p>
            <Link href="/checkout" onClick={closeCart} className="btn btn-primary mt-4 w-full">
              Checkout
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 w-full py-2 text-center text-xs font-bold text-muted transition-colors hover:text-plum"
            >
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
