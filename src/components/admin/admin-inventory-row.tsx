"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";
import { updateInventoryAction, updateProductAction, type AdminActionState } from "@/lib/actions/admin";
import type { InventoryItem } from "@/lib/data/admin";
import { formatEGP } from "@/lib/format";

function Feedback({ state }: { state: AdminActionState | null }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-semibold text-danger">
        <AlertCircle className="size-3.5" aria-hidden />
        {state.error}
      </p>
    );
  }
  return (
    <p role="status" className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-semibold text-success">
      <Check className="size-3.5" aria-hidden />
      {state.message}
    </p>
  );
}

export function AdminInventoryRow({ item }: { item: InventoryItem }) {
  const [stockState, stockAction, stockPending] = useActionState<AdminActionState | null, FormData>(
    updateInventoryAction,
    null,
  );
  const [productState, productAction, productPending] = useActionState<AdminActionState | null, FormData>(
    updateProductAction,
    null,
  );
  const [expanded, setExpanded] = useState(false);
  const low = item.quantityAvailable <= item.lowStockThreshold;

  return (
    <div className="rounded-xl border border-line bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-plum">{item.nameAr}</p>
          <p className="text-[0.65rem] text-muted">
            {item.slug} · {item.price !== undefined ? formatEGP(item.price) : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              low
                ? "rounded-full bg-danger/10 px-2.5 py-1 text-[0.62rem] font-bold text-danger"
                : "rounded-full bg-success/10 px-2.5 py-1 text-[0.62rem] font-bold text-success"
            }
          >
            المخزون: {item.quantityAvailable}
          </span>
          <span className="rounded-full bg-cream px-2.5 py-1 text-[0.62rem] font-semibold text-muted">
            حد التنبيه: {item.lowStockThreshold}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.62rem] font-bold text-plum"
            aria-expanded={expanded}
          >
            تعديل
            <ChevronDown className={`size-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-2">
          <form action={stockAction}>
            <input type="hidden" name="productId" value={item.productId} />
            <p className="label">تحديث المخزون</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`qty-${item.productId}`} className="sr-only">
                  الكمية المتاحة
                </label>
                <input
                  id={`qty-${item.productId}`}
                  name="quantityAvailable"
                  type="number"
                  min={0}
                  required
                  defaultValue={item.quantityAvailable}
                  className="field py-2 text-xs"
                />
              </div>
              <div className="w-24">
                <label htmlFor={`threshold-${item.productId}`} className="sr-only">
                  حد التنبيه
                </label>
                <input
                  id={`threshold-${item.productId}`}
                  name="lowStockThreshold"
                  type="number"
                  min={0}
                  defaultValue={item.lowStockThreshold}
                  className="field py-2 text-xs"
                />
              </div>
              <button type="submit" disabled={stockPending} className="btn btn-primary px-4 py-2 text-xs">
                {stockPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                حفظ
              </button>
            </div>
            <Feedback state={stockState} />
          </form>

          <form action={productAction}>
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="slug" value={item.slug} />
            <p className="label">تعديل المنتج</p>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor={`price-${item.productId}`} className="sr-only">
                  السعر
                </label>
                <input
                  id={`price-${item.productId}`}
                  name="price"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={item.price ?? 0}
                  className="field w-24 py-2 text-xs"
                />
              </div>
              <label className="flex items-center gap-1.5 pb-2 text-[0.65rem] font-semibold text-plum">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} className="size-3.5 accent-[#3B0F24]" />
                معروض
              </label>
              <label className="flex items-center gap-1.5 pb-2 text-[0.65rem] font-semibold text-plum">
                <input type="checkbox" name="isFeatured" defaultChecked={item.isFeatured} className="size-3.5 accent-[#3B0F24]" />
                مميز
              </label>
              <button type="submit" disabled={productPending} className="btn btn-outline px-4 py-2 text-xs">
                {productPending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                حفظ
              </button>
            </div>
            <Feedback state={productState} />
          </form>
        </div>
      )}
    </div>
  );
}
