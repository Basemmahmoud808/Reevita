"use server";

import { revalidatePath } from "next/cache";
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
  uploadCollectionCover,
  removeUploadedCollectionCover,
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/lib/data/admin";
import { OrderError } from "@/lib/data/orders";
import { getStaticProduct } from "@/lib/catalog";
import {
  adminInventorySchema,
  adminShippingSchema,
  adminStatusSchema,
  adminProductSchema,
  adminProductUpdateSchema,
} from "@/lib/validation";
import type { OrderStatus } from "@/lib/types";

export interface AdminActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_COLLECTION_IMAGE_BYTES = 5 * 1024 * 1024;
const COLLECTION_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function guard(): Promise<string | null> {
  const admin = await getAdminSession();
  return admin ? null : "غير مصرح لك بهذا الإجراء.";
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
    if (!(image instanceof File) || image.size === 0) return { error: "صورة المنتج مطلوبة." };
    if (!PRODUCT_IMAGE_TYPES.has(image.type) || image.size > MAX_PRODUCT_IMAGE_BYTES) return { error: "الصورة يجب أن تكون JPG أو PNG أو WEBP حتى 5 ميجابايت." };
    const productId = String(formData.get("productId") ?? "");
    if (!productId) return { error: "معرف المنتج مطلوب." };
    try {
      await replaceProductImage(productId, image, String(formData.get("nameAr") ?? ""));
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
  if (!(image instanceof File) || image.size === 0) return { error: "صورة المنتج مطلوبة." };
  if (!PRODUCT_IMAGE_TYPES.has(image.type)) return { error: "الصورة يجب أن تكون JPG أو PNG أو WEBP." };
  if (image.size > MAX_PRODUCT_IMAGE_BYTES) return { error: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت." };

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
    await createAdminProduct({ ...parsed.data, image });
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

function collectionInput(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim(),
    nameAr: String(formData.get("nameAr") ?? "").trim(),
    descriptionAr: String(formData.get("descriptionAr") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
    displayOrder: Number(formData.get("displayOrder") ?? 0),
    isPublished: formData.get("isPublished") === "on",
    purchaseReady: formData.get("purchaseReady") === "on",
    missingProducts: String(formData.get("missingProducts") ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20),
    productIds: [...new Set(formData.getAll("productIds").map(String).filter(Boolean))],
  };
}

function validateCollectionInput(input: ReturnType<typeof collectionInput>, coverImage: FormDataEntryValue | null): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) return "استخدمي رابطًا بحروف إنجليزية صغيرة وأرقام وشرطات فقط.";
  const hasUpload = coverImage instanceof File && coverImage.size > 0;
  if (!input.nameEn || !input.nameAr || (!input.image && !hasUpload)) return "اسم المجموعة وصورتها مطلوبان.";
  if (!Number.isInteger(input.displayOrder) || input.displayOrder < 0) return "ترتيب المجموعة غير صالح.";
  if (input.purchaseReady && (!input.productIds.length || input.missingProducts.length)) {
    return "لا يمكن إتاحة شراء الباقة قبل تعيين منتجاتها واستكمال المنتجات الناقصة.";
  }
  return null;
}

function validateCollectionCover(file: FormDataEntryValue | null): string | null {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!COLLECTION_IMAGE_TYPES.has(file.type)) return "صورة الغلاف يجب أن تكون JPG أو PNG أو WEBP.";
  if (file.size > MAX_COLLECTION_IMAGE_BYTES) return "حجم صورة الغلاف يجب ألا يتجاوز 5 ميجابايت.";
  return null;
}

export async function createCollectionAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };
  const input = collectionInput(formData);
  const coverImage = formData.get("coverImage");
  const validationError = validateCollectionInput(input, coverImage) ?? validateCollectionCover(coverImage);
  if (validationError) return { error: validationError };
  let uploadedCover: { path: string; url: string } | undefined;
  try {
    if (coverImage instanceof File && coverImage.size > 0) {
      uploadedCover = await uploadCollectionCover(input.slug, coverImage);
      input.image = uploadedCover.url;
    }
    await createCollection(input);
    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    revalidatePath("/");
    return { ok: true, message: "تم إنشاء الـ Collection ونشرها." };
  } catch (error) {
    if (uploadedCover) await removeUploadedCollectionCover(uploadedCover.path);
    console.error("[reevita] collection creation failed", error);
    return { error: "تعذر إنشاء الـ Collection." };
  }
}

export async function updateCollectionAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };
  const id = String(formData.get("id") ?? "");
  const input = collectionInput(formData);
  const coverImage = formData.get("coverImage");
  if (!id) return { error: "معرف المجموعة مطلوب." };
  const validationError = validateCollectionInput(input, coverImage) ?? validateCollectionCover(coverImage);
  if (validationError) return { error: validationError };
  let uploadedCover: { path: string; url: string } | undefined;
  try {
    if (coverImage instanceof File && coverImage.size > 0) {
      uploadedCover = await uploadCollectionCover(input.slug, coverImage);
      input.image = uploadedCover.url;
    }
    await updateCollection(id, input);
    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    revalidatePath(`/collections/${input.slug}`);
    revalidatePath("/");
    return { ok: true, message: "تم تحديث الـ Collection." };
  } catch (error) {
    if (uploadedCover) await removeUploadedCollectionCover(uploadedCover.path);
    console.error("[reevita] collection update failed", error);
    return { error: "تعذر تحديث الـ Collection." };
  }
}

export async function deleteCollectionAction(
  _prev: AdminActionState | null,
  formData: FormData,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return { error: denied };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "معرف الـ Collection مطلوب." };
  try {
    await deleteCollection(id);
    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    revalidatePath("/");
    return { ok: true, message: "تم حذف الـ Collection بدون حذف المنتجات." };
  } catch (error) {
    console.error("[reevita] collection deletion failed", error);
    return { error: "تعذر حذف الـ Collection." };
  }
}
