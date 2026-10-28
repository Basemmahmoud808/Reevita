"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkoutSchema, trackOrderSchema } from "@/lib/validation";
import { clientIp, hashedKey, rateLimit } from "@/lib/security/rate-limit";
import { ORDER_ERROR_MESSAGES, OrderError, placeOrder, trackOrder } from "@/lib/data/orders";
import { LAST_ORDER_COOKIE } from "@/lib/orders/constants";
import type { TrackedOrder } from "@/lib/types";

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

  // Two independent dimensions: the network (IP) and the contact number. The IP
  // limit stops scripted floods from one host; the phone limit stops a single
  // number from spamming orders across rotating proxies. Phone numbers are
  // hashed so no personal data is written to the rate-limit store.
  const ipLimited = await rateLimit(`checkout:${ip}`, 5, 10 * 60 * 1000);
  const phoneLimited = values.customerPhone
    ? await rateLimit(hashedKey("checkout-phone", values.customerPhone), 5, 10 * 60 * 1000)
    : { allowed: true, remaining: 5, retryAfterSeconds: 0 };
  if (!ipLimited.allowed || !phoneLimited.allowed) {
    const retryAfter = Math.max(ipLimited.retryAfterSeconds, phoneLimited.retryAfterSeconds, 30);
    return {
      error: `عدد محاولات الطلب كبير. يرجى المحاولة بعد ${Math.ceil(retryAfter / 60)} دقيقة.`,
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
    idempotencyKey: formData.get("idempotencyKey") ?? undefined,
    terms: formData.get("terms") === "on",
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
      },
      ip,
      parsed.data.idempotencyKey,
    );

    // The confirmation page re-reads the order from the backend using the order
    // number + phone (the same anti-IDOR pair as tracking). Only those two values
    // are stored client-side, so the cookie can never act as a source of truth
    // for totals, prices or "order confirmed" claims.
    const cookieStore = await cookies();
    cookieStore.set(LAST_ORDER_COOKIE, encodeURIComponent(JSON.stringify({ orderNumber: order.orderNumber, phone: order.customerPhone })), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
      secure: process.env.NODE_ENV === "production",
    });

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
