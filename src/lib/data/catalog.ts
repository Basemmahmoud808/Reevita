import { cache } from "react";
import { categories as staticCategories, getStaticCategory, getStaticProduct, staticProducts } from "@/lib/catalog";
import { demoGovernorates, demoProducts } from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Governorate, Product, StockStatus } from "@/lib/types";

/** Central read layer for the public catalogue. Falls back to the static catalogue in demo mode. */

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  short_description: string | null;
  short_description_ar: string | null;
  description: string;
  price: number;
  compare_at_price: number | null;
  benefits: string[] | null;
  ingredients: string | null;
  how_to_use: string | null;
  size: string | null;
  is_featured: boolean;
  category: { slug: string; name: string; name_ar: string } | null;
  images: { image_url: string; alt_text: string | null; is_primary: boolean; display_order: number }[] | null;
}

const SELECT_PRODUCT = `
  id, slug, name, name_ar, short_description, short_description_ar, description,
  price, compare_at_price, benefits, ingredients, how_to_use, size, is_featured,
  category:categories ( slug, name, name_ar ),
  images:product_images ( image_url, alt_text, is_primary, display_order )
`;

function mapStock(status: string | undefined): StockStatus {
  if (status === "out_of_stock" || status === "low_stock") return status;
  return "in_stock";
}

function mapProduct(row: ProductRow, availability: Map<string, StockStatus>): Product {
  const meta = getStaticProduct(row.slug);
  const category = staticCategories.find((item) => item.slug === row.category?.slug);
  const images = [...(row.images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order)
    .map((image) => ({ url: image.image_url, alt: image.alt_text ?? row.name_ar }));

  return {
    id: row.id,
    slug: row.slug,
    sku: meta?.sku ?? `RV-${row.slug.toUpperCase()}`,
    nameAr: row.name_ar,
    nameEn: row.name,
    shortAr: row.short_description_ar ?? meta?.shortAr ?? "",
    descriptionAr: row.description,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price === null ? null : Number(row.compare_at_price),
    size: row.size ?? meta?.size ?? "",
    categorySlug: row.category?.slug ?? meta?.categorySlug ?? "",
    categoryNameAr: row.category?.name_ar ?? category?.nameAr ?? "",
    categoryNameEn: row.category?.name ?? category?.nameEn ?? "",
    fragranceSlug: meta?.fragranceSlug ?? "botanical",
    fragranceNameAr: meta?.fragranceNameAr ?? "",
    fragranceNameEn: meta?.fragranceNameEn ?? "",
    variantLabelAr: meta?.variantLabelAr ?? null,
    benefits: row.benefits ?? meta?.benefits ?? [],
    ingredientsAr: row.ingredients ?? meta?.ingredientsAr ?? "",
    howToUseAr: row.how_to_use ?? meta?.howToUseAr ?? "",
    images: images.length > 0 ? images : (meta?.images ?? []),
    rating: meta?.rating ?? 4.8,
    reviews: meta?.reviews ?? 0,
    stockStatus: availability.get(row.id) ?? meta?.stockStatus ?? "in_stock",
    isFeatured: row.is_featured,
    isNew: meta?.isNew ?? false,
    badge: meta?.badge ?? null,
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured) return demoProducts();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoProducts();

  const [{ data, error }, availabilityResult] = await Promise.all([
    supabase.from("products").select(SELECT_PRODUCT).eq("is_active", true).order("created_at", { ascending: true }),
    supabase.from("product_availability").select("product_id, stock_status"),
  ]);

  if (error) {
    console.error("[reevita] product query failed, serving static catalogue", error.message);
    return staticProducts;
  }

  const availability = new Map<string, StockStatus>();
  for (const row of (availabilityResult.data ?? []) as Array<{ product_id: string; stock_status: string }>) {
    availability.set(row.product_id, mapStock(row.stock_status));
  }

  return ((data ?? []) as unknown as ProductRow[]).map((row) => mapProduct(row, availability));
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) ?? null;
});

export const getProductsByCategory = cache(async (slug: string): Promise<Product[]> => {
  const products = await getProducts();
  return products.filter((product) => product.categorySlug === slug);
});

export const getProductsByFragrance = cache(async (slug: string): Promise<Product[]> => {
  const products = await getProducts();
  return products.filter((product) => product.fragranceSlug === slug);
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return staticCategories;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return staticCategories;
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, name_ar, description, image_url, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error || !data) return staticCategories;
  return (data as Array<Record<string, unknown>>).map((row) => {
    const meta = getStaticCategory(String(row.slug));
    return {
      slug: String(row.slug),
      nameAr: String(row.name_ar),
      nameEn: String(row.name),
      shortAr: meta?.shortAr ?? "",
      descriptionAr: String(row.description ?? meta?.descriptionAr ?? ""),
      image: String(row.image_url ?? meta?.image ?? ""),
      displayOrder: Number(row.display_order ?? 0),
    };
  });
});

export const getGovernorates = cache(async (): Promise<Governorate[]> => {
  if (!isSupabaseConfigured) return demoGovernorates();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoGovernorates();
  const { data, error } = await supabase
    .from("governorates")
    .select(
      `id, code, name_ar, name_en, zone,
       shipping_rate:shipping_rates ( shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max )`,
    )
    .eq("is_active", true)
    .order("name_ar", { ascending: true });
  if (error || !data) {
    console.error("[reevita] governorates query failed", error?.message);
    return demoGovernorates();
  }
  return (data as Array<Record<string, unknown>>).map((row) => {
    const rateRaw = row.shipping_rate as
      | { shipping_cost: number; free_shipping_threshold: number; estimated_days_min: number; estimated_days_max: number }
      | Array<{ shipping_cost: number; free_shipping_threshold: number; estimated_days_min: number; estimated_days_max: number }>
      | null;
    const rate = Array.isArray(rateRaw) ? rateRaw[0] : rateRaw;
    return {
      id: String(row.id),
      code: String(row.code),
      nameAr: String(row.name_ar),
      nameEn: String(row.name_en),
      zone: String(row.zone),
      shippingCost: Number(rate?.shipping_cost ?? 65),
      freeShippingThreshold: Number(rate?.free_shipping_threshold ?? 1000),
      estimatedDaysMin: Number(rate?.estimated_days_min ?? 2),
      estimatedDaysMax: Number(rate?.estimated_days_max ?? 4),
    };
  });
});
