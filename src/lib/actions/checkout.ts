"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkoutSchema, trackOrderSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { ORDER_ERROR_MESSAGES, OrderError, placeOrder, trackOrder } from "@/lib/data/orders";
import { LAST_ORDER_COOKIE } from "@/lib/orders/constants";
import type { TrackedOrder } from "@/lib/types";
import { notifyAdminOfNewOrder } from "@/lib/notifications/admin-push";
import { notifyAdminViaTelegram } from "@/lib/notifications/admin-telegram";

export interface CheckoutFormState {
  error?: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
}

function checkoutValues(formData: FormData): Record<string, string> {
  return {
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    governorateId: String(formData.get("governorateId") ?? ""),
    city: String(formData.get("city") ?? ""),
    addressLine: String(formData.get("addressLine") ?? ""),
    landmark: String(formData.get("landmark") ?? ""),
    orderNotes: String(formData.get("orderNotes") ?? ""),
    terms: formData.get("terms") === "on" ? "on" : "",
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  };
}

/** Creates the COD order through the security-definer RPC; prices are computed server-side. */
export async function placeOrderAction(
  _prev: CheckoutFormState | null,
  formData: FormData,
): Promise<CheckoutFormState> {
  const values = checkoutValues(formData);
  const headerList = await headers();
  const ip = clientIp(headerList);
  const limited = await rateLimit(`checkout:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.allowed) {
    return {
      error: "عدد محاولات الطلب كبير. يرجى المحاولة بعد قليل.",
      code: "RATE_LIMITED",
      values,
    };
  }

  let items: unknown = null;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "سلة المشتريات غير صالحة. يرجى تحديث الصفحة.", code: "INVALID_ITEM", values };
  }

  // Display-only snapshot for the confirmation page (prices/totals always come from the RPC).
  let snapshot: unknown = [];
  try {
    snapshot = JSON.parse(String(formData.get("cartSnapshot") ?? "[]"));
  } catch {
    snapshot = [];
  }
  const displayItems = Array.isArray(snapshot)
    ? snapshot.slice(0, 20).map((item) => {
        const record = item as Record<string, unknown>;
        const quantity = Math.max(1, Math.min(10, Math.round(Number(record.quantity) || 1)));
        const unitPrice = Math.max(0, Number(record.price) || 0);
        return {
          productName: String(record.nameAr ?? "").slice(0, 140),
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
        };
      })
    : [];

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") ?? "",
    governorateId: String(formData.get("governorateId") ?? "").trim(),
    city: formData.get("city"),
    addressLine: formData.get("addressLine"),
    landmark: formData.get("landmark") ?? "",
    orderNotes: formData.get("orderNotes") ?? "",
    items,
    terms: formData.get("terms") === "on",
    idempotencyKey: formData.get("idempotencyKey") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const firstError = Object.values(fieldErrors).flat()[0];
    return {
      error: firstError ?? "يرجى مراجعة بيانات الطلب.",
      code: "VALIDATION",
      fieldErrors,
      values,
    };
  }

  try {
    const order = await placeOrder(
      {
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail,
        governorateId: parsed.data.governorateId,
        city: parsed.data.city,
        addressLine: parsed.data.addressLine,
        landmark: parsed.data.landmark,
        orderNotes: parsed.data.orderNotes,
        items: parsed.data.items,
        idempotencyKey: parsed.data.idempotencyKey,
      },
      ip,
    );

    if (!order.isDuplicate) {
      const notice = {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        total: order.total,
      };
      const notifications = await Promise.allSettled([
        notifyAdminOfNewOrder(notice),
        notifyAdminViaTelegram(notice),
      ]);
      if (notifications.some((result) => result.status === "rejected")) {
        // Notification delivery must never prevent a completed order from being confirmed.
        console.error("[reevita] one or more admin order notifications failed");
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(
      LAST_ORDER_COOKIE,
      encodeURIComponent(
        JSON.stringify({
          ...order,
          items: order.items && order.items.length > 0 ? order.items : displayItems,
        }),
      ),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 30,
        secure: process.env.NODE_ENV === "production",
      },
    );

    redirect(`/order/${order.orderNumber}`);
  } catch (error) {
    if (error instanceof OrderError) {
      return { error: error.message, code: error.code, values };
    }
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[reevita] checkout failed", error);
    return { error: ORDER_ERROR_MESSAGES.UNKNOWN ?? "تعذّر إتمام الطلب. يرجى المحاولة مرة أخرى.", values };
  }
}

export interface TrackFormState {
  error?: string;
  result?: TrackedOrder;
}

export async function trackOrderAction(_prev: TrackFormState | null, formData: FormData): Promise<TrackFormState> {
  const headerList = await headers();
  const ip = clientIp(headerList);
  const limited = await rateLimit(`track:${ip}`, 12, 60 * 1000);
  if (!limited.allowed) {
    return { error: "عدد كبير من المحاولات. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى." };
  }

  const parsed = trackOrderSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "يرجى مراجعة البيانات المدخلة." };
  }

  try {
    const result = await trackOrder(parsed.data.orderNumber, parsed.data.phone);
    return { result };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error("[reevita] tracking failed", error);
    return { error: "تعذّر البحث عن الطلب. يرجى المحاولة لاحقًا." };
  }
}
