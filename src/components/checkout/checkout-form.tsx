"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrderAction, type CheckoutFormState } from "@/lib/actions/checkout";
import { formatEGP } from "@/lib/format";
import type { Governorate } from "@/lib/types";

export function CheckoutForm({
  governorates,
  isDemo,
}: {
  governorates: Governorate[];
  isDemo: boolean;
}) {
  const { lines, subtotal, ready } = useCart();
  const [state, formAction, pending] = useActionState<CheckoutFormState | null, FormData>(
    placeOrderAction,
    null,
  );
  const [governorateId, setGovernorateId] = useState("");

  const governorate = useMemo(
    () => governorates.find((item) => item.id === governorateId),
    [governorates, governorateId],
  );

  useEffect(() => {
    if (state?.error) {
      document.getElementById("checkout-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  const shippingFee = governorate
    ? subtotal >= governorate.freeShippingThreshold
      ? 0
      : governorate.shippingCost
    : 0;
  const total = subtotal + shippingFee;
  const itemsJson = JSON.stringify(
    lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
  );

  const errorFor = (field: string) => state?.fieldErrors?.[field]?.[0];

  if (!ready) {
    return (
      <div className="container-luxe py-20">
        <div className="skeleton h-8 w-56 rounded-full" />
        <div className="skeleton mt-8 h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-luxe flex flex-col items-center py-20 text-center">
        <h1 className="display-xl">لا يمكن إتمام الطلب</h1>
        <p className="lead mt-3">سلتك فارغة حاليًا. أضيفي منتجات أولًا.</p>
        <Link href="/shop" className="btn btn-primary mt-7">
          تسوّقي الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="mb-8">
        <p className="eyebrow">CHECKOUT · الدفع عند الاستلام</p>
        <h1 className="display-xl mt-3">إتمام الطلب</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
          املئي بيانات التوصيل وسنتواصل معك لتأكيد الطلب قبل الشحن. لا حاجة لأي دفع مقدم.
        </p>
      </div>

      {isDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.78rem] leading-6 text-plum">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
          <span>
            <strong>وضع العرض التجريبي:</strong> الطلب سيُحفظ محليًا على السيرفر للتجربة فقط ولن يتم
            شحنه. أضيفي مفاتيح Supabase في <code dir="ltr">.env.local</code> لتشغيل الطلبات الحقيقية.
          </span>
        </div>
      ) : null}

      <form action={formAction} className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <input type="hidden" name="items" value={itemsJson} />
        <input
          type="hidden"
          name="cartSnapshot"
          value={JSON.stringify(
            lines.map((line) => ({
              nameAr: line.nameAr,
              quantity: line.quantity,
              price: line.price,
            })),
          )}
        />

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
            <h2 className="display-md flex items-center gap-2 text-lg">
              <span className="flex size-7 items-center justify-center rounded-full bg-plum text-xs font-bold text-ivory">1</span>
              بيانات المستلمة
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="customerName" className="label">
                  الاسم بالكامل *
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  required
                  autoComplete="name"
                  className="field"
                  placeholder="مثال: سارة أحمد"
                  aria-invalid={Boolean(errorFor("customerName"))}
                  aria-describedby={errorFor("customerName") ? "err-customerName" : undefined}
                />
                {errorFor("customerName") && (
                  <p id="err-customerName" className="mt-1.5 text-xs font-semibold text-danger">
                    {errorFor("customerName")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="label">
                  رقم الموبايل *
                </label>
                <input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  className="field text-start"
                  placeholder="01XXXXXXXXX"
                  aria-invalid={Boolean(errorFor("customerPhone"))}
                  aria-describedby={errorFor("customerPhone") ? "err-customerPhone" : undefined}
                />
                {errorFor("customerPhone") && (
                  <p id="err-customerPhone" className="mt-1.5 text-xs font-semibold text-danger">
                    {errorFor("customerPhone")}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerEmail" className="label">
                  البريد الإلكتروني <span className="font-normal text-muted">(اختياري)</span>
                </label>
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  className="field text-start"
                  placeholder="name@example.com"
                />
                {errorFor("customerEmail") && (
                  <p className="mt-1.5 text-xs font-semibold text-danger">{errorFor("customerEmail")}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
            <h2 className="display-md flex items-center gap-2 text-lg">
              <span className="flex size-7 items-center justify-center rounded-full bg-plum text-xs font-bold text-ivory">2</span>
              عنوان التوصيل
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="governorateId" className="label">
                  المحافظة *
                </label>
                <select
                  id="governorateId"
                  name="governorateId"
                  required
                  value={governorateId}
                  onChange={(event) => setGovernorateId(event.target.value)}
                  className="field"
                  aria-invalid={Boolean(errorFor("governorateId"))}
                >
                  <option value="">اختاري المحافظة</option>
                  {governorates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr} — {formatEGP(item.shippingCost)}
                    </option>
                  ))}
                </select>
                {errorFor("governorateId") && (
                  <p className="mt-1.5 text-xs font-semibold text-danger">{errorFor("governorateId")}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="label">
                  المدينة / الحي *
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  className="field"
                  placeholder="مثال: مدينة نصر"
                  aria-invalid={Boolean(errorFor("city"))}
                />
                {errorFor("city") && (
                  <p className="mt-1.5 text-xs font-semibold text-danger">{errorFor("city")}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="addressLine" className="label">
                  العنوان التفصيلي *
                </label>
                <input
                  id="addressLine"
                  name="addressLine"
                  required
                  autoComplete="street-address"
                  className="field"
                  placeholder="الشارع، رقم العمارة، رقم الشقة"
                  aria-invalid={Boolean(errorFor("addressLine"))}
                />
                {errorFor("addressLine") && (
                  <p className="mt-1.5 text-xs font-semibold text-danger">{errorFor("addressLine")}</p>
                )}
              </div>

              <div>
                <label htmlFor="landmark" className="label">
                  علامة مميزة <span className="font-normal text-muted">(اختياري)</span>
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  className="field"
                  placeholder="بجوار مسجد / مدرسة…"
                />
              </div>

              <div>
                <label htmlFor="orderNotes" className="label">
                  ملاحظات للطلب <span className="font-normal text-muted">(اختياري)</span>
                </label>
                <input id="orderNotes" name="orderNotes" className="field" placeholder="مثال: الاتصال قبل الوصول" />
              </div>
            </div>

            {governorate && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-cream/70 px-3.5 py-2.5 text-[0.72rem] text-plum">
                <Truck className="size-4 shrink-0 text-gold-deep" aria-hidden />
                التوصيل إلى {governorate.nameAr} خلال {governorate.estimatedDaysMin}–
                {governorate.estimatedDaysMax} أيام عمل — الشحن{" "}
                {shippingFee === 0 ? "مجاني" : formatEGP(shippingFee)}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
            <h2 className="display-md flex items-center gap-2 text-lg">
              <span className="flex size-7 items-center justify-center rounded-full bg-plum text-xs font-bold text-ivory">3</span>
              طريقة الدفع
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/50 bg-gold/5 p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
              <div>
                <p className="text-sm font-bold text-plum">الدفع عند الاستلام (COD)</p>
                <p className="mt-1 text-[0.75rem] leading-6 text-muted">
                  ادفعي نقدًا للمندوب عند استلام الشحنة. لا يتم تحصيل أي مبلغ مقدم، ولن نطلب بيانات أي
                  بطاقة بنكية.
                </p>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2.5 text-[0.75rem] leading-6 text-muted">
              <input
                type="checkbox"
                name="terms"
                required
                className="mt-1 size-4 shrink-0 accent-[#3B0F24]"
              />
              <span>
                أوافق على{" "}
                <Link href="/policies/terms" className="font-bold text-gold-deep hover:underline" target="_blank">
                  الشروط والأحكام
                </Link>{" "}
                و{" "}
                <Link href="/policies/returns" className="font-bold text-gold-deep hover:underline" target="_blank">
                  سياسة الاسترجاع
                </Link>
                .
              </span>
            </label>
          </section>

          {state?.error && (
            <div
              id="checkout-error"
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3.5 text-sm font-semibold text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{state.error}</span>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-card">
            <h2 className="display-md text-xl">طلبك</h2>
            <ul className="mt-4 divide-y divide-line">
              {lines.map((line) => (
                <li key={line.productId} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold text-plum">{line.nameAr}</p>
                    <p className="mt-0.5 text-[0.68rem] text-muted">
                      {line.size} × {line.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-plum">
                    {formatEGP(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">الإجمالي الفرعي</dt>
                <dd className="font-semibold text-plum">{formatEGP(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">الشحن</dt>
                <dd className="font-semibold text-plum">
                  {governorate ? (shippingFee === 0 ? "مجاني" : formatEGP(shippingFee)) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-bold text-plum">الإجمالي</dt>
                <dd className="text-xl font-bold text-plum">{formatEGP(total)}</dd>
              </div>
            </dl>

            <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  جاري تأكيد الطلب…
                </>
              ) : (
                <>
                  تأكيد الطلب
                  <ArrowLeft className="size-4" aria-hidden />
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.68rem] text-muted">
              <Lock className="size-3" aria-hidden />
              بياناتك محمية ومشفرة أثناء النقل
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
