import type { OrderStatus } from "@/lib/types";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "refused",
  "returned",
  "cancelled",
];

interface StatusMeta {
  ar: string;
  en: string;
  /** Progress index used by the customer-facing tracker (terminal negative states excluded). */
  step: number;
  tone: "neutral" | "progress" | "success" | "danger";
  descriptionAr: string;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: {
    ar: "قيد المراجعة",
    en: "New",
    step: 0,
    tone: "progress",
    descriptionAr: "استلمنا طلبك وجاري مراجعته وتأكيده معك.",
  },
  confirmed: {
    ar: "تم التأكيد",
    en: "Confirmed",
    step: 1,
    tone: "progress",
    descriptionAr: "تم تأكيد طلبك ويجري تجهيزه الآن.",
  },
  packed: {
    ar: "تم التجهيز",
    en: "Packed",
    step: 2,
    tone: "progress",
    descriptionAr: "تم تجهيز وتغليف الشحنة بعناية.",
  },
  shipped: {
    ar: "في الطريق إليك",
    en: "Shipped",
    step: 3,
    tone: "progress",
    descriptionAr: "الشحنة مع مندوب شركة الشحن في طريقها إليك.",
  },
  delivered: {
    ar: "تم التسليم",
    en: "Delivered",
    step: 4,
    tone: "success",
    descriptionAr: "تم تسليم الطلب بنجاح. نتمنى لكِ تجربة ريفيتا.",
  },
  refused: {
    ar: "مرفوض الاستلام",
    en: "Refused",
    step: 4,
    tone: "danger",
    descriptionAr: "تم رفض استلام الشحنة.",
  },
  returned: {
    ar: "تم الإرجاع",
    en: "Returned",
    step: 4,
    tone: "danger",
    descriptionAr: "تم إرجاع الشحنة إلى المتجر.",
  },
  cancelled: {
    ar: "ملغي",
    en: "Cancelled",
    step: 4,
    tone: "danger",
    descriptionAr: "تم إلغاء الطلب.",
  },
};

/**
 * Mirrors the database state-machine trigger in
 * supabase/migrations/20261020000004_order_state_machine_and_tracking.sql.
 * The UI only ever offers transitions the database will accept.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "refused", "returned"],
  delivered: ["returned"],
  refused: [],
  returned: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

export function statusMeta(status: string): StatusMeta {
  return STATUS_META[status as OrderStatus] ?? STATUS_META.new;
}

export const TRACKING_STEPS: { key: OrderStatus; ar: string }[] = [
  { key: "new", ar: "تم الطلب" },
  { key: "confirmed", ar: "تأكيد" },
  { key: "packed", ar: "تجهيز" },
  { key: "shipped", ar: "شحن" },
  { key: "delivered", ar: "تسليم" },
];
