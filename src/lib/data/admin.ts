import "server-only";
import { getStaticProduct } from "@/lib/catalog";
import {
  demoAuditLog,
  demoGovernorates,
  demoInventory,
  demoMetrics,
  demoOrder,
  demoOrders,
  demoUpdateInventory,
  demoUpdateOrderStatus,
  demoUpdateShippingRate,
  demoAllCollections,
  demoCreateCollection,
  demoUpdateCollection,
  demoDeleteCollection,
} from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/env";
import { canTransition } from "@/lib/orders/status";
import { OrderError, errorFromSupabase } from "@/lib/data/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Collection, Governorate, OrderStatus } from "@/lib/types";
import { canonicalProductNames } from "@/lib/product-names";

export interface CreateAdminProductInput {
  name: string;
  nameAr: string;
  slug: string;
  categorySlug: string;
  shortDescriptionAr?: string;
  shortDescription?: string;
  compareAtPrice?: number | null;
  size?: string;
  description: string;
  price: number;
  quantityAvailable: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  image: File;
  publish: boolean;
}

export interface AdminOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  governorateAr: string;
  city: string;
  addressLine: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminMetrics {
  total_orders: number;
  total_sales_egp: number;
  orders_by_status: Record<string, number>;
  delivered_count: number;
  refused_count: number;
  refusal_rate_percentage: number;
  low_stock_count: number;
  low_stock_items: Array<{
    product_id: string;
    name: string;
    name_ar: string;
    quantity_available: number;
    low_stock_threshold: number;
  }>;
  average_order_value?: number;
}

export interface AdminOrdersQuery {
  status?: string | null;
  search?: string | null;
  governorateId?: string | null;
  limit?: number;
  offset?: number;
}

function mapDemoOrder(order: ReturnType<typeof demoOrders>[number]): AdminOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    governorateAr: order.governorateAr,
    city: order.city,
    addressLine: order.addressLine,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    currency: order.currency,
    shippingCarrier: order.shippingCarrier,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productName: item.nameAr,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

export async function getAdminOrders(query: AdminOrdersQuery): Promise<{ orders: AdminOrder[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);

  if (!isSupabaseConfigured) {
    const filtered = demoOrders().filter((order) => {
      if (query.status && order.status !== query.status) return false;
      if (query.governorateId && order.governorateId !== query.governorateId) return false;
      if (query.search) {
        const needle = query.search.toLowerCase();
        if (
          !order.orderNumber.toLowerCase().includes(needle) &&
          !order.customerName.toLowerCase().includes(needle) &&
          !order.customerPhone.includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
    return { orders: filtered.slice(offset, offset + limit).map(mapDemoOrder), total: filtered.length };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { orders: [], total: 0 };
  const { data, error } = await supabase.rpc("admin_get_orders", {
    p_status: query.status ?? null,
    p_governorate_id: query.governorateId ?? null,
    p_search: query.search ?? null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw errorFromSupabase(error.message);

  const result = data as unknown as {
    total_count: number;
    orders: Array<{
      id: string;
      order_number: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      governorate_ar: string;
      status: OrderStatus;
      payment_method: string;
      payment_status: string;
      subtotal: number;
      shipping_fee: number;
      total: number;
      currency: string;
      shipping_carrier: string | null;
      tracking_number: string | null;
      created_at: string;
      shipping_address_snapshot: { city?: string; address_line?: string };
      items: Array<{ product_name: string; quantity: number; unit_price: number; total_price: number }> | null;
    }>;
  };

  return {
    total: Number(result.total_count),
    orders: (result.orders ?? []).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      governorateAr: order.governorate_ar,
      city: order.shipping_address_snapshot?.city ?? "",
      addressLine: order.shipping_address_snapshot?.address_line ?? "",
      status: order.status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shipping_fee),
      total: Number(order.total),
      currency: order.currency,
      shippingCarrier: order.shipping_carrier,
      trackingNumber: order.tracking_number,
      createdAt: order.created_at,
      items: (order.items ?? []).map((item) => ({
        productName: item.product_name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
      })),
    })),
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrder | null> {
  if (!isSupabaseConfigured) {
    const order = demoOrder(orderId);
    return order ? mapDemoOrder(order) : null;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, customer_name, customer_phone, customer_email, status, payment_method, payment_status,
       subtotal, shipping_fee, total, currency, shipping_carrier, tracking_number, created_at,
       shipping_address_snapshot, governorate:governorates ( name_ar ),
       order_items ( product_name, quantity, unit_price, total_price )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) return null;
  const order = data as unknown as Record<string, unknown>;
  const snapshot = (order.shipping_address_snapshot ?? {}) as { city?: string; address_line?: string };
  const governorate = order.governorate as { name_ar?: string } | Array<{ name_ar?: string }> | null;
  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    customerName: String(order.customer_name),
    customerPhone: String(order.customer_phone),
    customerEmail: (order.customer_email as string | null) ?? null,
    governorateAr: Array.isArray(governorate) ? (governorate[0]?.name_ar ?? "") : (governorate?.name_ar ?? ""),
    city: snapshot.city ?? "",
    addressLine: snapshot.address_line ?? "",
    status: order.status as OrderStatus,
    paymentMethod: String(order.payment_method),
    paymentStatus: String(order.payment_status),
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
    currency: String(order.currency),
    shippingCarrier: (order.shipping_carrier as string | null) ?? null,
    trackingNumber: (order.tracking_number as string | null) ?? null,
    createdAt: String(order.created_at),
    items: ((order.order_items ?? []) as Array<Record<string, unknown>>).map((item) => ({
      productName: String(item.product_name),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    })),
  };
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  if (!isSupabaseConfigured) return demoMetrics();
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { data, error } = await supabase.rpc("admin_get_metrics");
  if (error) throw errorFromSupabase(error.message);
  const metrics = data as unknown as AdminMetrics;
  return {
    ...metrics,
    total_sales_egp: Number(metrics.total_sales_egp),
    refusal_rate_percentage: Number(metrics.refusal_rate_percentage),
  };
}

export async function updateOrderStatus(input: {
  orderId: string;
  newStatus: OrderStatus;
  reason?: string;
  carrier?: string;
  trackingNumber?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) {
    const order = demoOrder(input.orderId);
    if (!order) throw new OrderError("ORDER_NOT_FOUND");
    if (!canTransition(order.status, input.newStatus)) throw new OrderError("INVALID_STATUS_TRANSITION");
    demoUpdateOrderStatus(input);
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: input.orderId,
    p_new_status: input.newStatus,
    p_reason: input.reason ?? null,
    p_shipping_carrier: input.carrier ?? null,
    p_tracking_number: input.trackingNumber ?? null,
  });
  if (error) throw errorFromSupabase(error.message);
}

export interface InventoryItem {
  productId: string;
  name: string;
  nameAr: string;
  slug: string;
  quantityAvailable: number;
  lowStockThreshold: number;
  price?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  image?: string;
  categorySlug?: string;
  shortDescription?: string;
  shortDescriptionAr?: string;
  description?: string;
  compareAtPrice?: number | null;
  size?: string;
}

export type AdminCollection = Collection;

export async function getAdminCollections(): Promise<AdminCollection[]> {
  if (!isSupabaseConfigured) return demoAllCollections();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, name, name_ar, description, cover_image_url, display_order, is_published, collection_products(product_id)")
    .order("display_order", { ascending: true });
  if (error || !data) throw new OrderError("UNKNOWN");
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    nameEn: String(row.name),
    nameAr: String(row.name_ar),
    descriptionAr: String(row.description ?? ""),
    image: String(row.cover_image_url ?? ""),
    displayOrder: Number(row.display_order ?? 0),
    isPublished: Boolean(row.is_published),
    productIds: ((row.collection_products ?? []) as Array<{ product_id: string }>).map((item) => item.product_id),
  }));
}

export async function createCollection(input: Omit<Collection, "id">): Promise<void> {
  if (!isSupabaseConfigured) {
    demoCreateCollection(input);
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { data, error } = await supabase.from("collections").insert({
    slug: input.slug,
    name: input.nameEn,
    name_ar: input.nameAr,
    description: input.descriptionAr,
    cover_image_url: input.image || null,
    display_order: input.displayOrder,
    is_published: input.isPublished,
  }).select("id").single();
  if (error || !data) throw new OrderError("UNKNOWN");
  if (input.productIds?.length) {
    const { error: productsError } = await supabase.from("collection_products").insert(input.productIds.map((productId, index) => ({ collection_id: data.id, product_id: productId, display_order: index })));
    if (productsError) throw new OrderError("UNKNOWN");
  }
}

export async function updateCollection(id: string, input: Omit<Collection, "id">): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!demoUpdateCollection(id, input)) throw new OrderError("NOT_FOUND");
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { error } = await supabase.from("collections").update({
    slug: input.slug,
    name: input.nameEn,
    name_ar: input.nameAr,
    description: input.descriptionAr,
    cover_image_url: input.image || null,
    display_order: input.displayOrder,
    is_published: input.isPublished,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new OrderError("UNKNOWN");
  const { error: deleteError } = await supabase.from("collection_products").delete().eq("collection_id", id);
  if (deleteError) throw new OrderError("UNKNOWN");
  if (input.productIds?.length) {
    const { error: productsError } = await supabase.from("collection_products").insert(input.productIds.map((productId, index) => ({ collection_id: id, product_id: productId, display_order: index })));
    if (productsError) throw new OrderError("UNKNOWN");
  }
}

export async function deleteCollection(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!demoDeleteCollection(id)) throw new OrderError("NOT_FOUND");
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw new OrderError("UNKNOWN");
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) return demoInventory();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const [productsResult, inventoryResult] = await Promise.all([
    supabase.from("products").select("id, name, name_ar, slug, short_description, short_description_ar, description, size, price, compare_at_price, is_active, is_featured, category:categories(slug), product_images(image_url, is_primary, display_order)").order("name_ar"),
    supabase.from("inventory").select("product_id, quantity_available, low_stock_threshold"),
  ]);
  const inventory = new Map<string, { quantity: number; threshold: number }>();
  for (const row of (inventoryResult.data ?? []) as Array<Record<string, unknown>>) {
    inventory.set(String(row.product_id), {
      quantity: Number(row.quantity_available),
      threshold: Number(row.low_stock_threshold),
    });
  }
  return ((productsResult.data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const record = inventory.get(String(row.id));
    const images = (row.product_images ?? []) as Array<{ image_url: string; is_primary: boolean; display_order: number }>;
    const primary = [...images].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.display_order - b.display_order,
    )[0];
    const slug = String(row.slug);
    const categorySlug = (Array.isArray(row.category) ? row.category[0]?.slug : (row.category as { slug?: string } | null)?.slug) ?? "";
    const names = canonicalProductNames({
      slug,
      categorySlug,
      size: String(row.size ?? ""),
      nameEn: String(row.name),
      nameAr: String(row.name_ar),
      variantLabelAr: getStaticProduct(slug)?.variantLabelAr,
    });
    return {
      productId: String(row.id),
      name: names.nameEn,
      nameAr: names.nameAr,
      slug,
      quantityAvailable: record?.quantity ?? 0,
      lowStockThreshold: record?.threshold ?? 5,
      price: Number(row.price),
      isActive: Boolean(row.is_active),
      isFeatured: Boolean(row.is_featured),
      image: primary?.image_url ?? getStaticProduct(String(row.slug))?.images[0]?.url ?? "",
      categorySlug,
      shortDescription: String(row.short_description ?? ""),
      shortDescriptionAr: String(row.short_description_ar ?? ""),
      description: String(row.description ?? ""),
      compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
      size: String(row.size ?? ""),
    };
  });
}

export async function updateInventory(productId: string, quantity: number, threshold?: number): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!demoUpdateInventory(productId, quantity, threshold)) throw new OrderError("NOT_FOUND");
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { error } = await supabase.rpc("admin_update_inventory", {
    p_product_id: productId,
    p_quantity_available: quantity,
    p_low_stock_threshold: threshold ?? null,
  });
  if (error) throw errorFromSupabase(error.message);
}

export async function updateProductFlags(
  productId: string,
  patch: { name?: string; nameAr?: string; slug?: string; categoryId?: string | null; shortDescription?: string | null; shortDescriptionAr?: string | null; description?: string; size?: string | null; price?: number; compareAtPrice?: number | null; isActive?: boolean; isFeatured?: boolean },
): Promise<void> {
  if (!isSupabaseConfigured) {
    const product = demoInventory().find((item) => item.productId === productId);
    if (!product) throw new OrderError("NOT_FOUND");
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.price !== undefined) update.price = patch.price;
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.nameAr !== undefined) update.name_ar = patch.nameAr;
  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
  if (patch.shortDescription !== undefined) update.short_description = patch.shortDescription;
  if (patch.shortDescriptionAr !== undefined) update.short_description_ar = patch.shortDescriptionAr;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.size !== undefined) update.size = patch.size;
  if (patch.compareAtPrice !== undefined) update.compare_at_price = patch.compareAtPrice;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  if (patch.isFeatured !== undefined) update.is_featured = patch.isFeatured;
  const { error } = await supabase.from("products").update(update).eq("id", productId);
  if (error) throw errorFromSupabase(error.message);
}

export async function replaceProductImage(productId: string, image: File, altText: string): Promise<void> {
  if (!isSupabaseConfigured) throw new OrderError("UNKNOWN");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { data: oldImages } = await supabase.from("product_images").select("id, image_url").eq("product_id", productId);
  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("product-images").upload(objectPath, image, { contentType: image.type, upsert: false });
  if (uploadError) throw errorFromSupabase(uploadError.message);
  const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  const { error: imageError } = await supabase.from("product_images").insert({ product_id: productId, image_url: publicUrl.publicUrl, alt_text: altText, display_order: 0, is_primary: true });
  if (imageError) {
    await supabase.storage.from("product-images").remove([objectPath]);
    throw errorFromSupabase(imageError.message);
  }
  const oldIds = (oldImages ?? []).map((row) => row.id);
  if (oldIds.length) await supabase.from("product_images").delete().in("id", oldIds);
  const oldPaths = (oldImages ?? []).flatMap((row) => {
    const path = String(row.image_url).split("/product-images/")[1];
    return path ? [path] : [];
  });
  if (oldPaths.length) await supabase.storage.from("product-images").remove(oldPaths);
}

export async function archiveProduct(productId: string): Promise<void> {
  return updateProductFlags(productId, { isActive: false });
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!isSupabaseConfigured) throw new OrderError("UNKNOWN");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { count, error: countError } = await supabase.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", productId);
  if (countError) throw errorFromSupabase(countError.message);
  if ((count ?? 0) > 0) throw new OrderError("CONFLICT");
  const { data: images } = await supabase.from("product_images").select("image_url").eq("product_id", productId);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw errorFromSupabase(error.message);
  const paths = (images ?? []).flatMap((row) => {
    const path = String(row.image_url).split("/product-images/")[1];
    return path ? [path] : [];
  });
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
}

export async function createAdminProduct(input: CreateAdminProductInput): Promise<void> {
  if (!isSupabaseConfigured) throw new OrderError("UNKNOWN");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", input.categorySlug)
    .maybeSingle();
  if (categoryError || !category) throw new OrderError("NOT_FOUND");

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      category_id: category.id,
      slug: input.slug,
      name: input.name,
      name_ar: input.nameAr,
      short_description_ar: input.shortDescriptionAr || null,
      description: input.description,
      price: input.price,
      compare_at_price: input.compareAtPrice ?? null,
      size: input.size || null,
      is_featured: input.isFeatured,
      is_active: input.publish,
    })
    .select("id")
    .single();
  if (productError || !product) throw errorFromSupabase(productError?.message ?? "PRODUCT_CREATE_FAILED");

  const productId = String(product.id);
  const extension = input.image.type === "image/png" ? "png" : input.image.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("product-images").upload(objectPath, input.image, {
    contentType: input.image.type,
    upsert: false,
  });
  if (uploadError) {
    await supabase.from("products").delete().eq("id", productId);
    throw errorFromSupabase(uploadError.message);
  }

  const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(objectPath);
  const { error: imageError } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: publicUrl.publicUrl,
    alt_text: input.nameAr,
    display_order: 0,
    is_primary: true,
  });
  if (imageError) {
    await supabase.storage.from("product-images").remove([objectPath]);
    await supabase.from("products").delete().eq("id", productId);
    throw errorFromSupabase(imageError.message);
  }

  const { error: inventoryError } = await supabase.from("inventory").insert({
    product_id: productId,
    quantity_available: input.quantityAvailable,
    low_stock_threshold: input.lowStockThreshold,
  });
  if (inventoryError) {
    await supabase.storage.from("product-images").remove([objectPath]);
    await supabase.from("products").delete().eq("id", productId);
    throw errorFromSupabase(inventoryError.message);
  }
}

export async function getShippingRates(): Promise<Governorate[]> {
  if (!isSupabaseConfigured) return demoGovernorates();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("governorates")
    .select(
      `id, code, name_ar, name_en, zone, shipping_rate:shipping_rates ( shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max )`,
    )
    .order("name_ar");
  if (error || !data) return [];
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
      shippingCost: Number(rate?.shipping_cost ?? 0),
      freeShippingThreshold: Number(rate?.free_shipping_threshold ?? 1000),
      estimatedDaysMin: Number(rate?.estimated_days_min ?? 2),
      estimatedDaysMax: Number(rate?.estimated_days_max ?? 4),
    };
  });
}

export async function updateShippingRate(governorateId: string, cost: number, threshold: number): Promise<void> {
  if (!isSupabaseConfigured) {
    if (!demoUpdateShippingRate(governorateId, cost, threshold)) throw new OrderError("NOT_FOUND");
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");
  const { error } = await supabase.rpc("admin_update_shipping_rate", {
    p_governorate_id: governorateId,
    p_shipping_cost: cost,
    p_free_shipping_threshold: threshold,
  });
  if (error) throw errorFromSupabase(error.message);
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function getAuditLog(limit = 20): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured) return demoAuditLog();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, entity, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    action: String(row.action),
    entity: String(row.entity),
    entityId: (row.entity_id as string | null) ?? null,
    details: (row.details ?? {}) as Record<string, unknown>,
    createdAt: String(row.created_at),
  }));
}
