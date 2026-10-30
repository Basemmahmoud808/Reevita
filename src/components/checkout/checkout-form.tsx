"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, Lock, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { placeOrderAction, type CheckoutFormState } from "@/lib/actions/checkout";
import { formatEGP } from "@/lib/format";
import { depositPayment } from "@/lib/payment";
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
  const [userGovernorateId, setUserGovernorateId] = useState<string | null>(null);
  const governorateId = userGovernorateId ?? state?.values?.governorateId ?? "";
  const [governorateErrorCleared, setGovernorateErrorCleared] = useState(false);
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `rv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );

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
        <h1 className="display-xl">Checkout unavailable</h1>
        <p className="lead mt-3">Your bag is empty. Add products before checking out.</p>
        <Link href="/" className="btn btn-primary mt-7">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="mb-8">
        <p className="eyebrow">CHECKOUT · CASH ON DELIVERY</p>
        <h1 className="display-xl mt-3">Complete your order</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted">
          Enter your delivery details and we will confirm your order before shipping. No upfront payment required.
        </p>
      </div>

      {isDemo ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.78rem] leading-6 text-plum">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
          <span>
            <strong>Demo mode:</strong> orders are saved locally for testing and are not shipped. Add Supabase
            keys to <code dir="ltr">.env.local</code> to enable live orders.
          </span>
        </div>
      ) : null}

      <form action={formAction} className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
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
              Recipient details
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="customerName" className="label">
                  Full name *
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  required
                  autoComplete="name"
                  defaultValue={state?.values?.customerName}
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
                  defaultValue={state?.values?.customerPhone}
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
                  Email <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  defaultValue={state?.values?.customerEmail}
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
              Delivery address
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="governorateId" className="label">
                  Governorate *
                </label>
                <select
                  id="governorateId"
                  name="governorateId"
                  required
                  value={governorateId}
                  onChange={(event) => {
                    const nextGovernorateId = event.target.value.trim();
                    setUserGovernorateId(nextGovernorateId);
                    setGovernorateErrorCleared(Boolean(nextGovernorateId));
                  }}
                  className="field"
                  aria-invalid={Boolean(errorFor("governorateId") && !governorateErrorCleared)}
                >
                  <option value="" disabled>
                    Select governorate
                  </option>
                  {governorates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr} — {formatEGP(item.shippingCost)}
                    </option>
                  ))}
                </select>
                {errorFor("governorateId") && !governorateErrorCleared && (
                  <p className="mt-1.5 text-xs font-semibold text-danger">{errorFor("governorateId")}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="label">
                  City / district *
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  defaultValue={state?.values?.city}
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
                  Full address *
                </label>
                <input
                  id="addressLine"
                  name="addressLine"
                  required
                  autoComplete="street-address"
                  defaultValue={state?.values?.addressLine}
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
                  Landmark <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  defaultValue={state?.values?.landmark}
                  className="field"
                  placeholder="بجوار مسجد / مدرسة…"
                />
              </div>

              <div>
                <label htmlFor="orderNotes" className="label">
                  Order notes <span className="font-normal text-muted">(optional)</span>
                </label>
                <input id="orderNotes" name="orderNotes" defaultValue={state?.values?.orderNotes} className="field" placeholder="مثال: الاتصال قبل الوصول" />
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
                <p className="text-sm font-bold text-plum">Cash on delivery (COD)</p>
                <p className="mt-1 text-[0.75rem] leading-6 text-muted">
                  يمكنك الدفع للمندوب عند الاستلام، أو إرسال العربون المتفق عليه عبر فودافون كاش أو إنستا باي. بعد إنشاء الطلب أرسلي صورة التحويل ورقم الطلب على واتساب، وسيتم خصم العربون المؤكد من المبلغ المتبقي.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/80 px-3 py-2 text-xs">
                  <span className="font-semibold text-muted">Vodafone Cash / InstaPay</span>
                  <a href={`tel:${depositPayment.phone}`} dir="ltr" className="font-bold text-plum underline decoration-gold/60 underline-offset-4">
                    {depositPayment.phone}
                  </a>
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2.5 text-[0.75rem] leading-6 text-muted">
              <input
                type="checkbox"
                name="terms"
                required
                defaultChecked={state?.values?.terms === "on"}
                className="mt-1 size-4 shrink-0 accent-[#3B0F24]"
                aria-invalid={Boolean(errorFor("terms"))}
                aria-describedby={errorFor("terms") ? "err-terms" : undefined}
              />
              <span>
                أوافق على الشروط والأحكام وسياسة الاسترجاع.
              </span>
            </label>
            {errorFor("terms") && (
              <p id="err-terms" className="mt-1.5 text-xs font-semibold text-danger">
                {errorFor("terms")}
              </p>
            )}
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
            <h2 className="display-md text-xl">Your order</h2>
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
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold text-plum">{formatEGP(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-semibold text-plum">
                  {governorate ? (shippingFee === 0 ? "مجاني" : formatEGP(shippingFee)) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-bold text-plum">Total</dt>
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
                  Confirm order
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
