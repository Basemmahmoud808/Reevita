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
} from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/env";
import { canTransition } from "@/lib/orders/status";
import { OrderError, errorFromSupabase } from "@/lib/data/orders";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Governorate, OrderStatus } from "@/lib/types";

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
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured) return demoInventory();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const [productsResult, inventoryResult] = await Promise.all([
    supabase.from("products").select("id, name, name_ar, slug, price, is_active, is_featured, product_images(image_url, is_primary, display_order)").order("name_ar"),
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
    return {
      productId: String(row.id),
      name: String(row.name),
      nameAr: String(row.name_ar),
      slug: String(row.slug),
      quantityAvailable: record?.quantity ?? 0,
      lowStockThreshold: record?.threshold ?? 5,
      price: Number(row.price),
      isActive: Boolean(row.is_active),
      isFeatured: Boolean(row.is_featured),
      image: primary?.image_url ?? getStaticProduct(String(row.slug))?.images[0]?.url ?? "",
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
  patch: { price?: number; compareAtPrice?: number | null; isActive?: boolean; isFeatured?: boolean },
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
  if (patch.compareAtPrice !== undefined) update.compare_at_price = patch.compareAtPrice;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  if (patch.isFeatured !== undefined) update.is_featured = patch.isFeatured;
  const { error } = await supabase.from("products").update(update).eq("id", productId);
  if (error) throw errorFromSupabase(error.message);
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
