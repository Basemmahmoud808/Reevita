"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAdminSession } from "@/lib/auth/session";
import {
  updateInventory,
  updateOrderStatus,
  updateProductFlags,
  replaceProductImage,
  archiveProduct,
  deleteProduct,
  updateShippingRate,
  createAdminProduct,
} from "@/lib/data/admin";
import { OrderError } from "@/lib/data/orders";
import { getStaticProduct } from "@/lib/catalog";
import { adminInventorySchema, adminShippingSchema, adminStatusSchema, adminProductSchema, adminProductUpdateSchema } from "@/lib/validation";
import { clientIp, hashedKey, rateLimit } from "@/lib/security/rate-limit";
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES, validateProductImage } from "@/lib/security/image-upload";
import type { OrderStatus } from "@/lib/types";

export interface AdminActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

/** Kept for backwards compatibility with the existing admin components. */
export { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES };

async function guard(): Promise<string | null> {
  const admin = await getAdminSession();
  if (!admin) return "غير مصرح لك بهذا الإجراء.";
  if (await isThrottled("mutations")) {
    return "عدد كبير من العمليات. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.";
  }
  return null;
}

/**
 * Server-side throttle for privileged mutations. Admin sessions are already
 * authenticated, so this is defence-in-depth against a stolen session or a
 * runaway client loop rather than a primary access control.
 */
async function isThrottled(adminScope: string): Promise<boolean> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  const limited = await rateLimit(hashedKey(`admin:${adminScope}`, ip), 60, 60 * 1000);
  return !limited.allowed;
}

export async function updateOrderStatusAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const parsed = adminStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    newStatus: formData.get("newStatus"),
    reason: formData.get("reason") || undefined,
    carrier: formData.get("carrier") || undefined,
    trackingNumber: formData.get("trackingNumber") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  try {
    await updateOrderStatus({
      orderId: parsed.data.orderId,
      newStatus: parsed.data.newStatus as OrderStatus,
      reason: parsed.data.reason,
      carrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { ok: true, message: "تم تحديث حالة الطلب بنجاح." };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error("[reevita] status update failed", error);
    return { error: "تعذّر تحديث الطلب." };
  }
}

export async function updateInventoryAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const parsed = adminInventorySchema.safeParse({
    productId: formData.get("productId"),
    quantityAvailable: Number(formData.get("quantityAvailable")),
    lowStockThreshold: formData.get("lowStockThreshold")
      ? Number(formData.get("lowStockThreshold"))
      : undefined,
  });
  if (!parsed.success) return { error: "الكمية أو معرف المنتج غير صالح." };

  try {
    await updateInventory(parsed.data.productId, parsed.data.quantityAvailable, parsed.data.lowStockThreshold);
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { ok: true, message: "تم تحديث المخزون." };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    return { error: "تعذّر تحديث المخزون." };
  }
}

export async function updateShippingRateAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const parsed = adminShippingSchema.safeParse({
    governorateId: formData.get("governorateId"),
    shippingCost: Number(formData.get("shippingCost")),
    freeShippingThreshold: Number(formData.get("freeShippingThreshold")),
  });
  if (!parsed.success) return { error: "بيانات الشحن غير صالحة." };

  try {
    await updateShippingRate(
      parsed.data.governorateId,
      parsed.data.shippingCost,
      parsed.data.freeShippingThreshold,
    );
    revalidatePath("/admin/shipping");
    return { ok: true, message: "تم تحديث رسوم الشحن." };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    return { error: "تعذّر تحديث رسوم الشحن." };
  }
}

export async function updateProductAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const priceRaw = formData.get("price");
  const compareRaw = formData.get("compareAtPrice");
  const parsed = adminProductUpdateSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    slug: formData.get("slug"),
    categorySlug: formData.get("categorySlug"),
    shortDescriptionAr: formData.get("shortDescriptionAr") || undefined,
    description: formData.get("description"),
    price: Number(priceRaw),
    compareAtPrice: compareRaw === null || compareRaw === "" ? null : Number(compareRaw),
    size: formData.get("size") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات المنتج غير صالحة." };
  if (parsed.data.compareAtPrice != null && parsed.data.compareAtPrice < parsed.data.price) {
    return { error: "سعر المقارنة يجب أن يكون أكبر من أو يساوي السعر." };
  }
  const slug = parsed.data.slug;
  const fallback = getStaticProduct(slug);

  try {
    const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
    if (!supabase) throw new OrderError("UNKNOWN");
    const { data: category } = await supabase.from("categories").select("id").eq("slug", parsed.data.categorySlug).maybeSingle();
    if (!category) return { error: "التصنيف غير موجود." };
    await updateProductFlags(parsed.data.productId, {
      name: parsed.data.name, nameAr: parsed.data.nameAr, slug: parsed.data.slug,
      categoryId: category.id, shortDescriptionAr: parsed.data.shortDescriptionAr || null,
      description: parsed.data.description, size: parsed.data.size || null,
      price: parsed.data.price, compareAtPrice: parsed.data.compareAtPrice,
      isActive: parsed.data.isActive, isFeatured: parsed.data.isFeatured,
    });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath(`/products/${slug}`);
    if (!fallback) console.warn("[reevita] product updated for unknown slug", slug);
    return { ok: true, message: "تم حفظ تعديلات المنتج." };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    return { error: "تعذّر حفظ تعديلات المنتج." };
  }
}

export async function replaceProductImageAction(
    _prev: AdminActionState | null,
    formData: FormData,
  ): Promise<AdminActionState> {
    const denied = await guard();
    if (denied) return { error: denied };
    const image = formData.get("image");
    const validation = await validateProductImage(image);
    if (!validation.ok) return { error: validation.error ?? "الصورة غير صالحة." };
    const productId = String(formData.get("productId") ?? "");
    if (!productId) return { error: "معرف المنتج مطلوب." };
    try {
      await replaceProductImage(productId, image as File, String(formData.get("nameAr") ?? ""));
      revalidatePath("/admin/products"); revalidatePath("/shop");
      return { ok: true, message: "تم استبدال صورة المنتج." };
    } catch { return { error: "تعذّر استبدال الصورة." }; }
  }

export async function archiveProductAction(_prev: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
    const denied = await guard(); if (denied) return { error: denied };
    const productId = String(formData.get("productId") ?? ""); if (!productId) return { error: "معرف المنتج مطلوب." };
    try { await archiveProduct(productId); revalidatePath("/admin/products"); revalidatePath("/shop"); return { ok: true, message: "تمت أرشفة المنتج وإخفاؤه من المتجر." }; }
    catch { return { error: "تعذّرت أرشفة المنتج." }; }
  }

export async function deleteProductAction(_prev: AdminActionState | null, formData: FormData): Promise<AdminActionState> {
    const denied = await guard(); if (denied) return { error: denied };
    const productId = String(formData.get("productId") ?? ""); if (!productId) return { error: "معرف المنتج مطلوب." };
    try { await deleteProduct(productId); revalidatePath("/admin/products"); revalidatePath("/shop"); return { ok: true, message: "تم حذف المنتج." }; }
    catch (error) { return { error: error instanceof OrderError && error.code === "CONFLICT" ? "لا يمكن حذف منتج مرتبط بطلبات؛ استخدمي الأرشفة بدلًا من ذلك." : "تعذّر حذف المنتج." }; }
}

export async function createProductAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const image = formData.get("image");
  const validation = await validateProductImage(image);
  if (!validation.ok) return { error: validation.error ?? "الصورة غير صالحة." };

  const compareRaw = formData.get("compareAtPrice");
  const parsed = adminProductSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    slug: formData.get("slug"),
    categorySlug: formData.get("categorySlug"),
    shortDescriptionAr: formData.get("shortDescriptionAr") || undefined,
    description: formData.get("description"),
    price: Number(formData.get("price")),
    compareAtPrice: compareRaw ? Number(compareRaw) : null,
    size: formData.get("size") || undefined,
    quantityAvailable: Number(formData.get("quantityAvailable")),
    lowStockThreshold: Number(formData.get("lowStockThreshold")),
    isFeatured: formData.get("isFeatured") === "on",
    publish: formData.get("publish") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "بيانات المنتج غير صالحة." };
  if (parsed.data.compareAtPrice !== null && parsed.data.compareAtPrice !== undefined && parsed.data.compareAtPrice < parsed.data.price) {
    return { error: "سعر المقارنة يجب أن يكون أكبر من أو يساوي السعر." };
  }

  try {
    await createAdminProduct({ ...parsed.data, image: image as File });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    return {
      ok: true,
      message: parsed.data.publish ? "تم نشر المنتج ورفعه إلى المتجر." : "تم حفظ المنتج كمسودة.",
    };
  } catch (error) {
    console.error("[reevita] product creation failed", error);
    return { error: error instanceof OrderError ? error.message : "تعذّر إنشاء المنتج." };
  }
}
