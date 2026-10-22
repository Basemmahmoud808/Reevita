"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";
import { updateInventoryAction, updateProductAction, replaceProductImageAction, archiveProductAction, deleteProductAction, type AdminActionState } from "@/lib/actions/admin";
import { categories } from "@/lib/catalog";
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
  const [imageState, imageAction, imagePending] = useActionState<AdminActionState | null, FormData>(replaceProductImageAction, null);
  const [archiveState, archiveAction, archivePending] = useActionState<AdminActionState | null, FormData>(archiveProductAction, null);
  const [deleteState, deleteAction, deletePending] = useActionState<AdminActionState | null, FormData>(deleteProductAction, null);
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

          <form action={productAction} className="md:col-span-2">
            <input type="hidden" name="productId" value={item.productId} />
            <p className="label">تعديل المنتج</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input name="name" required defaultValue={item.name} className="field py-2 text-xs" placeholder="English name" />
              <input name="nameAr" required defaultValue={item.nameAr} className="field py-2 text-xs" placeholder="الاسم بالعربية" />
              <input name="slug" required defaultValue={item.slug} className="field py-2 text-xs" placeholder="slug" dir="ltr" />
              <select name="categorySlug" required defaultValue={item.categorySlug} className="field py-2 text-xs">
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.nameAr}</option>)}
              </select>
              <textarea name="description" required defaultValue={item.description} className="field py-2 text-xs sm:col-span-2" rows={2} placeholder="الوصف" />
              <input name="shortDescriptionAr" defaultValue={item.shortDescriptionAr} className="field py-2 text-xs" placeholder="وصف مختصر" />
              <input name="size" defaultValue={item.size} className="field py-2 text-xs" placeholder="الحجم" />
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
              <input name="compareAtPrice" type="number" min={0} step="0.01" defaultValue={item.compareAtPrice ?? ""} className="field py-2 text-xs" placeholder="السعر قبل الخصم" />
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
          <form action={imageAction} encType="multipart/form-data" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="nameAr" value={item.nameAr} />
            <div className="min-w-48 flex-1"><label className="label">استبدال الصورة</label><input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="field py-2 text-xs" /></div>
            <button type="submit" disabled={imagePending} className="btn btn-outline px-4 py-2 text-xs">{imagePending ? <Loader2 className="size-3.5 animate-spin" /> : "رفع الصورة"}</button>
            <Feedback state={imageState} />
          </form>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 md:col-span-2">
            <form action={archiveAction}><input type="hidden" name="productId" value={item.productId} /><button type="submit" disabled={archivePending} className="btn btn-outline px-3 py-2 text-xs">أرشفة وإخفاء</button></form>
            {!item.isActive && <form action={deleteAction} onSubmit={(event) => { if (!window.confirm("سيُحذف المنتج نهائيًا إن لم يرتبط بطلبات. متابعة؟")) event.preventDefault(); }}><input type="hidden" name="productId" value={item.productId} /><button type="submit" disabled={deletePending} className="rounded-xl border border-danger/30 px-3 py-2 text-xs font-bold text-danger">حذف نهائي</button></form>}
            <Feedback state={archiveState} /><Feedback state={deleteState} />
          </div>
        </div>
      )}
    </div>
  );
}
