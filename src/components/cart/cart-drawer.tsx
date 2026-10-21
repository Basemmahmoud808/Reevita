"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatEGP } from "@/lib/format";
import { cn } from "@/lib/format";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    lines,
    count,
    subtotal,
    freeShippingRemaining,
    freeShippingThreshold,
  } = useCart();

  const progress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const qualified = freeShippingRemaining === 0;

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
        aria-label="إغلاق سلة المشتريات"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="سلة المشتريات"
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
              سلة المشتريات
              <span className="text-sm font-normal text-muted">({count})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full border border-line p-2 text-plum transition-colors hover:bg-cream"
            aria-label="إغلاق السلة"
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
                <span>مبروك! شحن مجاني على طلبك 🎉</span>
              ) : (
                <span>
                  أضيفي <span className="text-gold-deep">{formatEGP(freeShippingRemaining)}</span> للحصول على
                  شحن مجاني
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
              <p className="display-md text-lg">سلتك فارغة حاليًا</p>
              <p className="max-w-xs text-sm text-muted">
                ابدئي طقس جمالك باختيار منتجك المفضل من مجموعة ريفيتا.
              </p>
              <Link href="/shop" onClick={closeCart} className="btn btn-primary mt-2">
                تسوّقي الآن
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
              <span className="text-muted">الإجمالي الفرعي</span>
              <span className="text-lg font-bold text-plum">{formatEGP(subtotal)}</span>
            </div>
            <p className="mt-1 text-[0.7rem] text-muted">
              الشحن والدفع عند الاستلام يُحسبان في صفحة إتمام الطلب.
            </p>
            <Link href="/checkout" onClick={closeCart} className="btn btn-primary mt-4 w-full">
              إتمام الطلب
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 w-full py-2 text-center text-xs font-bold text-muted transition-colors hover:text-plum"
            >
              متابعة التسوق
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
