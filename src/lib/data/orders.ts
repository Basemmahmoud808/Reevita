import { isSupabaseConfigured } from "@/lib/env";
import { demoCustomerOrders, demoOrder, demoPlaceOrder, demoTrackOrder, toPlacedOrder } from "@/lib/demo/store";
import { isValidEgyptianPhone } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckoutPayload, OrderStatus, PlacedOrder, TrackedOrder } from "@/lib/types";

/** Error messages mirrored from docs/API_CONTRACT.md so the UI is always helpful. */
export const ORDER_ERROR_MESSAGES: Record<string, string> = {
  INVALID_PHONE: "يرجى إدخال رقم هاتف محمول مصري صحيح مكوّن من 11 رقمًا (010 / 011 / 012 / 015).",
  INVALID_INPUT: "يرجى استكمال الاسم والعنوان بالتفصيل لضمان سرعة التوصيل.",
  INVALID_LOCATION: "المحافظة المختارة غير متاحة حاليًا. يرجى اختيار محافظة أخرى.",
  INVALID_ITEM: "أحد المنتجات في السلة غير صالح. يرجى تحديث السلة والمحاولة مرة أخرى.",
  PRODUCT_UNAVAILABLE: "أحد المنتجات لم يعد متاحًا. يرجى تحديث السلة.",
  INSUFFICIENT_STOCK: "عذرًا، الكمية المطلوبة غير متوفرة حاليًا في المخزون.",
  ORDER_REJECTED: "عذرًا، لا يمكن إتمام الطلب. يرجى التواصل مع خدمة العملاء للمساعدة.",
  EMPTY_CART: "سلة مشترياتك فارغة.",
  FORBIDDEN: "غير مصرح لك بهذا الإجراء.",
  INVALID_STATUS_TRANSITION: "هذا الانتقال غير مسموح في حالة الطلب الحالية.",
  ORDER_NOT_FOUND: "لم يتم العثور على الطلب.",
  NOT_FOUND: "العنصر المطلوب غير موجود.",
};

export class OrderError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? ORDER_ERROR_MESSAGES[code] ?? "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    this.name = "OrderError";
    this.code = code;
  }
}

export function errorFromSupabase(message: string): OrderError {
  const code = message.match(/^([A-Z_]{3,}):/)?.[1] ?? "UNKNOWN";
  return new OrderError(code);
}

export async function placeOrder(
  payload: CheckoutPayload,
  ipAddress: string | null,
  idempotencyKey?: string,
): Promise<PlacedOrder> {
  if (!isSupabaseConfigured) {
    try {
      return demoPlaceOrder({
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail,
        governorateId: payload.governorateId,
        city: payload.city,
        addressLine: payload.addressLine,
        landmark: payload.landmark,
        orderNotes: payload.orderNotes,
        items: payload.items,
        idempotencyKey,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      return Promise.reject(errorFromSupabase(message));
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new OrderError("UNKNOWN");

  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: payload.customerName,
    p_customer_phone: payload.customerPhone,
    p_customer_email: payload.customerEmail ?? null,
    p_governorate_id: payload.governorateId,
    p_city: payload.city,
    p_address_line: payload.addressLine,
    p_landmark: payload.landmark ?? null,
    p_order_notes: payload.orderNotes ?? null,
    p_items: payload.items,
    p_ip_address: ipAddress,
    p_idempotency_key: idempotencyKey ?? null,
  });

  if (error) throw errorFromSupabase(error.message);
  const result = data as unknown as {
    success: boolean;
    order_id: string;
    order_number: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    subtotal: number;
    shipping_fee: number;
    cod_fee: number;
    total: number;
    currency: string;
    created_at: string;
    items?: Array<{ product_name: string; quantity: number; unit_price: number; total_price: number }>;
  };

  return {
    orderId: result.order_id,
    orderNumber: result.order_number,
    status: result.status,
    customerName: result.customer_name,
    customerPhone: result.customer_phone,
    subtotal: Number(result.subtotal),
    shippingFee: Number(result.shipping_fee),
    codFee: Number(result.cod_fee),
    total: Number(result.total),
    currency: result.currency,
    createdAt: result.created_at,
    items: (result.items ?? []).map((item) => ({
      productName: String(item.product_name),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    })),
  };
}

export async function trackOrder(orderNumber: string, phone: string): Promise<TrackedOrder> {
  if (!isValidEgyptianPhone(phone)) {
    return { found: false, messageAr: ORDER_ERROR_MESSAGES.INVALID_PHONE };
  }
  if (!isSupabaseConfigured) {
    return demoTrackOrder(orderNumber, phone);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { found: false, messageAr: ORDER_ERROR_MESSAGES.NOT_FOUND };

  const { data, error } = await supabase.rpc("track_order", {
    p_order_number: orderNumber.trim(),
    p_phone: phone.trim(),
  });
  if (error) return { found: false, messageAr: errorFromSupabase(error.message).message };

  const row = data as unknown as {
    found: boolean;
    order_number?: string;
    status?: string;
    status_ar?: string;
    shipping_carrier?: string;
    tracking_number?: string | null;
    destination_governorate?: string;
    total?: number;
    currency?: string;
    created_at?: string;
    message_ar?: string;
  };

  return {
    found: Boolean(row.found),
    orderNumber: row.order_number,
    status: row.status as OrderStatus | undefined,
    statusAr: row.status_ar,
    shippingCarrier: row.shipping_carrier,
    trackingNumber: row.tracking_number ?? null,
    destinationGovernorate: row.destination_governorate,
    total: row.total === undefined ? undefined : Number(row.total),
    currency: row.currency,
    createdAt: row.created_at,
    messageAr: row.message_ar,
  };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

export async function getCustomerOrders(email: string | null, phone: string | null): Promise<CustomerOrder[]> {
  if (!isSupabaseConfigured) {
    return demoCustomerOrders(email, phone).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productName: item.nameAr,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    }));
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, order_items ( product_name, quantity, unit_price, total_price )")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[reevita] customer orders query failed", error.message);
    return [];
  }
  return (data as Array<Record<string, unknown>>).map((order) => ({
    id: String(order.id),
    orderNumber: String(order.order_number),
    status: order.status as OrderStatus,
    total: Number(order.total),
    createdAt: String(order.created_at),
    items: (order.order_items as Array<Record<string, unknown>> | null)?.map((item) => ({
      productName: String(item.product_name),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    })) ?? [],
  }));
}

/** Used by the order-confirmation page: demo data can be re-read, Supabase cannot (RLS). */
export async function getPlacedDemoOrder(orderNumber: string) {
  if (!isSupabaseConfigured) {
    const order = demoOrder(orderNumber);
    return order ? toPlacedOrder(order) : null;
  }
  return null;
}
