"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2, MapPin, PackageSearch, Truck } from "lucide-react";
import { trackOrderAction, type TrackFormState } from "@/lib/actions/checkout";
import { TRACKING_STEPS, statusMeta } from "@/lib/orders/status";
import { formatDateTimeAr, formatEGP } from "@/lib/format";
import { cn } from "@/lib/format";

export function TrackForm({ initialOrder = "" }: { initialOrder?: string }) {
  const [state, formAction, pending] = useActionState<TrackFormState | null, FormData>(
    trackOrderAction,
    null,
  );
  const result = state?.result;
  const isNegative = result?.status === "cancelled" || result?.status === "refused" || result?.status === "returned";
  const currentStep = result?.status ? statusMeta(result.status).step : -1;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form action={formAction} className="rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-7">
        <h2 className="display-md text-xl">بيانات الطلب</h2>
        <p className="mt-1 text-[0.75rem] text-muted">
          أدخلي رقم الطلب ورقم الهاتف المستخدم عند الطلب. لا نكشف أي بيانات شخصية أخرى.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="orderNumber" className="label">
              رقم الطلب
            </label>
            <input
              id="orderNumber"
              name="orderNumber"
              required
              defaultValue={initialOrder}
              dir="ltr"
              className="field text-start"
              placeholder="RV-2026-10001"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="track-phone" className="label">
              رقم الموبايل
            </label>
            <input
              id="track-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              dir="ltr"
              className="field text-start"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </div>
        </div>
        <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PackageSearch className="size-4" aria-hidden />}
          {pending ? "جاري البحث…" : "بحث عن الطلب"}
        </button>
        {state?.error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {state.error}
          </p>
        )}
        <p className="mt-4 rounded-xl bg-cream/60 px-3 py-2.5 text-[0.68rem] leading-6 text-muted">
          لأسباب أمنية، نطلب رقم الطلب ورقم الهاتف معًا للتحقق من هوية صاحب الطلب. لا تشاركي رقم
          طلبك مع أي شخص.
        </p>
      </form>

      <div aria-live="polite">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/40 px-6 py-16 text-center">
            <PackageSearch className="size-10 text-gold/70" aria-hidden />
            <p className="display-md mt-4 text-lg">حالة طلبك ستظهر هنا</p>
            <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
              أدخلي بيانات الطلب في النموذج المجاور لعرض حالة الشحنة وخط سير التوصيل.
            </p>
          </div>
        ) : result.found ? (
          <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-card sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-bold tracking-[0.2em] text-gold-deep uppercase">ORDER STATUS</p>
                <p dir="ltr" className="latin mt-1 text-xl font-semibold text-plum">
                  {result.orderNumber}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[0.68rem] font-bold",
                  isNegative ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
                )}
              >
                {result.status ? statusMeta(result.status).ar : ""}
              </span>
            </div>

            <p className="mt-4 rounded-xl bg-cream/60 px-4 py-3 text-[0.8rem] font-semibold leading-7 text-plum">
              {result.statusAr}
            </p>

            {!isNegative && (
              <div className="mt-7">
                <ol className="flex items-start justify-between gap-1">
                  {TRACKING_STEPS.map((step, index) => {
                    const done = currentStep >= index;
                    return (
                      <li key={step.key} className="flex flex-1 flex-col items-center text-center">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-full border-2 text-[0.7rem] font-bold",
                            done
                              ? "border-gold bg-gold text-plum-deep"
                              : "border-line bg-white text-muted",
                          )}
                        >
                          {done ? <Check className="size-4" aria-hidden /> : index + 1}
                        </span>
                        <span className={cn("mt-2 text-[0.62rem] font-semibold", done ? "text-plum" : "text-muted")}>
                          {step.ar}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="relative mt-[-46px] mb-9 -z-0 h-0.5 w-full bg-line" aria-hidden />
              </div>
            )}

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-white/70 p-3.5">
                <dt className="flex items-center gap-1.5 text-[0.62rem] text-muted">
                  <Truck className="size-3.5" aria-hidden /> شركة الشحن
                </dt>
                <dd className="mt-1 text-xs font-bold text-plum">{result.shippingCarrier ?? "الشحن الداخلي"}</dd>
              </div>
              <div className="rounded-xl border border-line bg-white/70 p-3.5">
                <dt className="text-[0.62rem] text-muted">رقم التتبع</dt>
                <dd dir="ltr" className="mt-1 text-xs font-bold text-plum">
                  {result.trackingNumber ?? "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-line bg-white/70 p-3.5">
                <dt className="flex items-center gap-1.5 text-[0.62rem] text-muted">
                  <MapPin className="size-3.5" aria-hidden /> المحافظة
                </dt>
                <dd className="mt-1 text-xs font-bold text-plum">{result.destinationGovernorate}</dd>
              </div>
              <div className="rounded-xl border border-line bg-white/70 p-3.5">
                <dt className="text-[0.62rem] text-muted">إجمالي الطلب</dt>
                <dd className="mt-1 text-xs font-bold text-plum">
                  {typeof result.total === "number" ? formatEGP(result.total) : "—"}
                </dd>
              </div>
            </dl>

            {result.createdAt && (
              <p className="mt-3 text-[0.65rem] text-muted">تاريخ الطلب: {formatDateTimeAr(result.createdAt)}</p>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 px-6 py-16 text-center">
            <AlertCircle className="size-10 text-danger/70" aria-hidden />
            <p className="display-md mt-4 text-lg">لم نجد طلبًا مطابقًا</p>
            <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
              {result.messageAr ?? "تأكدي من رقم الطلب ورقم الهاتف وحاولي مرة أخرى."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
