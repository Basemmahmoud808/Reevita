"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { updateOrderStatusAction, type AdminActionState } from "@/lib/actions/admin";
import { nextStatuses, statusMeta } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

export function AdminStatusForm({
  orderId,
  currentStatus,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    updateOrderStatusAction,
    null,
  );
  const options = nextStatuses(currentStatus);

  if (options.length === 0) {
    return (
      <div className="rounded-xl bg-cream/70 px-4 py-3 text-xs font-semibold text-muted">
        هذه الحالة نهائية — لا توجد انتقالات متاحة.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="newStatus" className="label">
          الحالة الجديدة
        </label>
        <select id="newStatus" name="newStatus" required className="field">
          {options.map((status) => (
            <option key={status} value={status}>
              {statusMeta(status).ar}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="carrier" className="label">
            شركة الشحن <span className="font-normal text-muted">(اختياري)</span>
          </label>
          <input
            id="carrier"
            name="carrier"
            defaultValue={carrier ?? ""}
            className="field"
            placeholder="Bosta / Aramex / مندوب ريفيتا"
          />
        </div>
        <div>
          <label htmlFor="trackingNumber" className="label">
            رقم البوليصة <span className="font-normal text-muted">(اختياري)</span>
          </label>
          <input
            id="trackingNumber"
            name="trackingNumber"
            dir="ltr"
            defaultValue={trackingNumber ?? ""}
            className="field text-start"
            placeholder="TRK-12345"
          />
        </div>
      </div>
      <div>
        <label htmlFor="reason" className="label">
          سبب التغيير <span className="font-normal text-muted">(اختياري)</span>
        </label>
        <input id="reason" name="reason" className="field" placeholder="مثال: تم التأكيد هاتفيًا" />
      </div>

      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
          <Check className="size-3.5" aria-hidden />
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        تحديث حالة الطلب
      </button>
      <p className="text-[0.65rem] leading-5 text-muted">
        ملاحظة: الانتقالات محمية داخل قاعدة البيانات، وأي انتقال غير منطقي سيُرفض حتى لو تم تجاوز الواجهة.
      </p>
    </form>
  );
}
