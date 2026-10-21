"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { updateShippingRateAction, type AdminActionState } from "@/lib/actions/admin";
import type { Governorate } from "@/lib/types";
import { formatEGP } from "@/lib/format";

export function AdminShippingRow({ governorate }: { governorate: Governorate }) {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    updateShippingRateAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="grid items-end gap-3 rounded-xl border border-line bg-white/70 p-4 sm:grid-cols-[1fr_100px_120px_auto]"
    >
      <input type="hidden" name="governorateId" value={governorate.id} />
      <div>
        <p className="text-sm font-bold text-plum">{governorate.nameAr}</p>
        <p className="text-[0.62rem] text-muted">
          {governorate.zone} · {governorate.estimatedDaysMin}–{governorate.estimatedDaysMax} أيام
        </p>
      </div>
      <div>
        <label htmlFor={`cost-${governorate.id}`} className="label text-[0.65rem]">
          الشحن
        </label>
        <input
          id={`cost-${governorate.id}`}
          name="shippingCost"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={governorate.shippingCost}
          className="field py-1.5 text-xs"
          aria-label={`رسوم شحن ${governorate.nameAr}`}
        />
      </div>
      <div>
        <label htmlFor={`threshold-${governorate.id}`} className="label text-[0.65rem]">
          شحن مجاني فوق
        </label>
        <input
          id={`threshold-${governorate.id}`}
          name="freeShippingThreshold"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={governorate.freeShippingThreshold}
          className="field py-1.5 text-xs"
          aria-label={`حد الشحن المجاني ${governorate.nameAr}`}
        />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2 text-xs">
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : "حفظ"}
        </button>
        {state?.ok && <Check className="size-4 text-success" aria-hidden />}
        {state?.error && <AlertCircle className="size-4 text-danger" aria-hidden />}
      </div>
      {state?.ok && (
        <p className="text-[0.62rem] font-semibold text-success sm:col-span-4" role="status">
          {formatEGP(Number(governorate.shippingCost))} → {state.message}
        </p>
      )}
      {state?.error && (
        <p className="text-[0.62rem] font-semibold text-danger sm:col-span-4" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
