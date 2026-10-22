"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Loader2, Upload } from "lucide-react";
import { createProductAction, type AdminActionState } from "@/lib/actions/admin";
import { categories } from "@/lib/catalog";

export function AdminProductForm() {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    createProductAction,
    null,
  );

  return (
    <form action={formAction} encType="multipart/form-data" className="glass-surface rounded-2xl p-5">
      <div className="mb-5">
        <p className="eyebrow">NEW PRODUCT</p>
        <h2 className="display-md mt-2">إضافة منتج جديد</h2>
        <p className="mt-1 text-xs text-muted">يحفظ كمسودة افتراضيًا، أو انشريه مباشرة بعد اكتمال البيانات.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="product-name-ar" className="label">اسم المنتج بالعربية</label>
          <input id="product-name-ar" name="nameAr" required className="field" />
        </div>
        <div>
          <label htmlFor="product-name" className="label">اسم المنتج بالإنجليزية</label>
          <input id="product-name" name="name" required dir="ltr" className="field text-start" />
        </div>
        <div>
          <label htmlFor="product-slug" className="label">الرابط المختصر</label>
          <input id="product-slug" name="slug" required dir="ltr" placeholder="body-lotion-new" className="field text-start" />
        </div>
        <div>
          <label htmlFor="product-category" className="label">التصنيف</label>
          <select id="product-category" name="categorySlug" required className="field">
            <option value="">اختاري التصنيف</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.nameAr}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-price" className="label">السعر</label>
          <input id="product-price" name="price" type="number" min="0" step="0.01" required className="field" />
        </div>
        <div>
          <label htmlFor="product-compare" className="label">السعر قبل الخصم <span className="font-normal text-muted">(اختياري)</span></label>
          <input id="product-compare" name="compareAtPrice" type="number" min="0" step="0.01" className="field" />
        </div>
        <div>
          <label htmlFor="product-size" className="label">الحجم <span className="font-normal text-muted">(اختياري)</span></label>
          <input id="product-size" name="size" placeholder="250 مل" className="field" />
        </div>
        <div>
          <label htmlFor="product-image" className="label">الصورة الرئيسية</label>
          <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line bg-cream/50 px-4 text-xs font-semibold text-muted transition-colors hover:border-gold hover:text-plum">
            <Upload className="size-4 text-gold-deep" aria-hidden />
            <span>JPG أو PNG أو WEBP — حتى 5 ميجابايت</span>
            <input id="product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="sr-only" />
          </label>
        </div>
        <div>
          <label htmlFor="product-quantity" className="label">الكمية المتاحة</label>
          <input id="product-quantity" name="quantityAvailable" type="number" min="0" defaultValue="0" required className="field" />
        </div>
        <div>
          <label htmlFor="product-threshold" className="label">حد التنبيه للمخزون</label>
          <input id="product-threshold" name="lowStockThreshold" type="number" min="0" defaultValue="5" required className="field" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-3 text-xs font-semibold text-plum">
            <input type="checkbox" name="isFeatured" className="size-4 accent-[#29332e]" />
            منتج مميز
          </label>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="product-short" className="label">وصف مختصر <span className="font-normal text-muted">(اختياري)</span></label>
          <input id="product-short" name="shortDescriptionAr" className="field" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="product-description" className="label">وصف المنتج</label>
          <textarea id="product-description" name="description" required rows={4} className="field resize-y" />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-danger/5 px-3 py-2.5 text-xs font-semibold text-danger">
          <AlertCircle className="size-4" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs font-semibold text-success">
          <Check className="size-4" aria-hidden />
          {state.message}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="submit" name="publish" value="false" disabled={pending} className="btn btn-outline">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          حفظ كمسودة
        </button>
        <button type="submit" name="publish" value="true" disabled={pending} className="btn btn-primary">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          حفظ ونشر
        </button>
      </div>
    </form>
  );
}
