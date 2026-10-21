"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { formatEGP } from "@/lib/format";

export function CartPageContent() {
  const { lines, subtotal, count, freeShippingRemaining, freeShippingThreshold, ready } = useCart();

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
        <h1 className="display-xl mt-6">سلتك فارغة</h1>
        <p className="lead mt-3 max-w-md">
          لم تختاري منتجاتك بعد. تصفّحي مجموعات ريفيتا وابدئي طقس جمالك اليوم.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            تسوّقي الآن
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <Link href="/collections" className="btn btn-outline">
            اكتشفي العطور
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
          <h1 className="display-xl mt-3">سلة المشتريات</h1>
          <p className="mt-2 text-sm text-muted">{count} منتج في سلتك</p>
        </div>
        <Link href="/shop" className="text-sm font-bold text-plum transition-colors hover:text-gold-deep">
          متابعة التسوق ←
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
            <h2 className="display-md text-xl">ملخص الطلب</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">الإجمالي الفرعي</dt>
                <dd className="font-bold text-plum">{formatEGP(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">الشحن</dt>
                <dd className="font-semibold text-plum">
                  {freeShippingRemaining === 0 ? "مجاني" : "يُحسب حسب المحافظة"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-bold text-plum">الإجمالي التقديري</dt>
                <dd className="text-lg font-bold text-plum">{formatEGP(subtotal)}</dd>
              </div>
            </dl>

            {freeShippingRemaining > 0 ? (
              <div className="mt-5 rounded-xl bg-cream/70 p-3.5">
                <p className="flex items-center gap-2 text-[0.72rem] font-bold text-plum">
                  <Truck className="size-4 text-gold-deep" aria-hidden />
                  أضيفي {formatEGP(freeShippingRemaining)} للحصول على شحن مجاني
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-gold/10 p-3.5 text-[0.72rem] font-bold text-gold-deep">
                <Truck className="size-4" aria-hidden />
                طلبك مؤهل للشحن المجاني
              </p>
            )}

            <Link href="/checkout" className="btn btn-primary mt-5 w-full">
              إتمام الطلب
              <ArrowLeft className="size-4" aria-hidden />
            </Link>

            <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-[0.7rem] text-muted">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-gold-deep" aria-hidden />
                الدفع عند الاستلام — بدون أي دفع مقدم
              </p>
              <p className="flex items-center gap-2">
                <Truck className="size-3.5 text-gold-deep" aria-hidden />
                شحن سريع لكل محافظات مصر
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
