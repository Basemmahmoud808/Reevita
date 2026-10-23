import { brand, getStaticProduct, staticProducts } from "@/lib/catalog";
import { normalizeEgyptianPhone } from "@/lib/phone";
import type {
  Governorate,
  OrderStatus,
  PlacedOrder,
  Product,
  StockStatus,
  TrackedOrder,
} from "@/lib/types";
import { STATUS_META } from "@/lib/orders/status";

/**
 * Demo mode store.
 *
 * Used only when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are absent. It mimics the
 * real backend contract closely (server-side price calculation, shipping rules,
 * order numbers, state machine) using in-memory state so the whole storefront —
 * including checkout, tracking and the admin dashboard — is reviewable before a
 * Supabase project is provisioned. It is never used when Supabase is configured.
 */

const zoneCost: Record<string, number> = {
  greater_cairo: 50,
  alexandria: 50,
  delta: 65,
  canal: 65,
  upper_egypt: 80,
  frontier: 100,
};

const zoneDays: Record<string, [number, number]> = {
  greater_cairo: [1, 2],
  alexandria: [1, 2],
  delta: [2, 3],
  canal: [2, 3],
  upper_egypt: [3, 4],
  frontier: [4, 6],
};

const GOVERNORATES: Array<[string, string, string, string]> = [
  ["CAI", "القاهرة", "Cairo", "greater_cairo"],
  ["GIZ", "الجيزة", "Giza", "greater_cairo"],
  ["QAL", "القليوبية", "Qalyubia", "greater_cairo"],
  ["ALX", "الإسكندرية", "Alexandria", "alexandria"],
  ["PTS", "بورسعيد", "Port Said", "canal"],
  ["SUZ", "السويس", "Suez", "canal"],
  ["ISM", "الإسماعيلية", "Ismailia", "canal"],
  ["DAM", "دمياط", "Damietta", "delta"],
  ["DKH", "الدقهلية", "Dakahlia", "delta"],
  ["SHR", "الشرقية", "Sharqia", "delta"],
  ["KFR", "كفر الشيخ", "Kafr El Sheikh", "delta"],
  ["GHB", "الغربية", "Gharbia", "delta"],
  ["MNF", "المنوفية", "Monufia", "delta"],
  ["BEH", "البحيرة", "Beheira", "delta"],
  ["FYM", "الفيوم", "Fayoum", "upper_egypt"],
  ["BNS", "بني سويف", "Beni Suef", "upper_egypt"],
  ["MNY", "المنيا", "Minya", "upper_egypt"],
  ["ASY", "أسيوط", "Asyut", "upper_egypt"],
  ["SHG", "سوهاج", "Sohag", "upper_egypt"],
  ["QNA", "قنا", "Qena", "upper_egypt"],
  ["LXR", "الأقصر", "Luxor", "upper_egypt"],
  ["ASW", "أسوان", "Aswan", "upper_egypt"],
  ["RSH", "البحر الأحمر", "Red Sea", "frontier"],
  ["WAD", "الوادي الجديد", "New Valley", "frontier"],
  ["MAT", "مطروح", "Matrouh", "frontier"],
  ["SIN", "شمال سيناء", "North Sinai", "frontier"],
  ["SIS", "جنوب سيناء", "South Sinai", "frontier"],
];

export function demoGovernorates(): Governorate[] {
  return GOVERNORATES.map(([code, nameAr, nameEn, zone], index) => ({
    id: `11111111-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    code,
    nameAr,
    nameEn,
    zone,
    shippingCost: zoneCost[zone] ?? 65,
    freeShippingThreshold: zone === "frontier" ? 1500 : zone === "upper_egypt" ? 1200 : 1000,
    estimatedDaysMin: zoneDays[zone]?.[0] ?? 2,
    estimatedDaysMax: zoneDays[zone]?.[1] ?? 4,
  }));
}

interface DemoStock {
  quantity: number;
  threshold: number;
}

const stock: Map<string, DemoStock> = new Map(
  staticProducts.map((product) => [product.id, { quantity: product.initialStock ?? 25, threshold: 5 }]),
);

function stockStatusOf(quantity: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= 5) return "low_stock";
  return "in_stock";
}

export function demoProducts(): Product[] {
  return staticProducts.map((product) => {
    const record = stock.get(product.id);
    return { ...product, stockStatus: stockStatusOf(record?.quantity ?? 0) };
  });
}

export function demoProduct(slug: string): Product | undefined {
  return demoProducts().find((product) => product.slug === slug);
}

export function demoInventory() {
  return demoProducts().map((product) => {
    const record = stock.get(product.id);
    return {
      productId: product.id,
      name: product.nameEn,
      nameAr: product.nameAr,
      slug: product.slug,
      quantityAvailable: record?.quantity ?? 0,
      lowStockThreshold: record?.threshold ?? 5,
      updatedAt: new Date().toISOString(),
    };
  });
}

export interface DemoOrderItem {
  productId: string;
  productName: string;
  nameAr: string;
  image: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  governorateId: string;
  governorateAr: string;
  city: string;
  addressLine: string;
  landmark: string | null;
  notes: string | null;
  status: OrderStatus;
  paymentMethod: "cod";
  paymentStatus: "pending" | "paid";
  subtotal: number;
  shippingFee: number;
  codFee: number;
  total: number;
  currency: "EGP";
  shippingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: DemoOrderItem[];
  history: { from: OrderStatus | null; to: OrderStatus; reason: string; at: string }[];
}

function isoDaysAgo(days: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, Math.floor(Math.random() * 50) + 5, 0, 0);
  return date.toISOString();
}

function buildOrder(
  index: number,
  data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    governorateCode: string;
    city: string;
    addressLine: string;
    status: OrderStatus;
    daysAgo: number;
    items: Array<{ slug: string; quantity: number }>;
    carrier?: string;
    tracking?: string;
  },
): DemoOrder {
  const governorate = demoGovernorates().find((gov) => gov.code === data.governorateCode) ?? demoGovernorates()[0]!;
  const items: DemoOrderItem[] = data.items.map(({ slug, quantity }) => {
    const product = getStaticProduct(slug)!;
    return {
      productId: product.id,
      productName: product.nameEn,
      nameAr: product.nameAr,
      image: product.images[0]?.url ?? "",
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingFee = subtotal >= governorate.freeShippingThreshold ? 0 : governorate.shippingCost;
  const createdAt = isoDaysAgo(data.daysAgo);
  return {
    id: `99999999-0000-0000-0000-${String(index).padStart(12, "0")}`,
    orderNumber: `RV-2026-${String(10000 + index)}`,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail ?? null,
    governorateId: governorate.id,
    governorateAr: governorate.nameAr,
    city: data.city,
    addressLine: data.addressLine,
    landmark: null,
    notes: null,
    status: data.status,
    paymentMethod: "cod",
    paymentStatus: data.status === "delivered" ? "paid" : "pending",
    subtotal,
    shippingFee,
    codFee: brand.codFee,
    total: subtotal + shippingFee + brand.codFee,
    currency: "EGP",
    shippingCarrier: data.carrier ?? (data.status === "shipped" ? "REEVITA Express" : null),
    trackingNumber: data.tracking ?? (data.status === "shipped" ? `RVX-${900000 + index}` : null),
    createdAt,
    items,
    history: [
      { from: null, to: "new", reason: "Order created", at: createdAt },
      ...(data.status !== "new"
        ? [{ from: "new" as OrderStatus, to: data.status, reason: "Demo status", at: createdAt }]
        : []),
    ],
  };
}

const orders: DemoOrder[] = [
  buildOrder(1, {
    customerName: "منى عبد الرحمن",
    customerPhone: "+201012345678",
    customerEmail: "mona@example.com",
    governorateCode: "CAI",
    city: "مدينة نصر",
    addressLine: "شارع عباس العقاد، عمارة 12، شقة 4",
    status: "delivered",
    daysAgo: 18,
    items: [
      { slug: "body-lotion-queen", quantity: 1 },
      { slug: "body-butter-queen", quantity: 1 },
    ],
    carrier: "REEVITA Express",
  }),
  buildOrder(2, {
    customerName: "ياسمين سامي",
    customerPhone: "+201112345678",
    governorateCode: "GIZ",
    city: "الدقي",
    addressLine: "شارع التحرير، عمارة 44، شقة 7",
    status: "new",
    daysAgo: 0,
    items: [
      { slug: "hair-mist-sexy", quantity: 1 },
      { slug: "shampoo-aloe-vera", quantity: 1 },
    ],
  }),
  buildOrder(3, {
    customerName: "نور هشام",
    customerPhone: "+201212345678",
    governorateCode: "ALX",
    city: "سموحة",
    addressLine: "شارع فوزي معاذ، فيلا 9",
    status: "confirmed",
    daysAgo: 2,
    items: [{ slug: "body-splash-ruby-musk", quantity: 2 }],
  }),
  buildOrder(4, {
    customerName: "سارة مجدي",
    customerPhone: "+201512345678",
    governorateCode: "DKH",
    city: "المنصورة",
    addressLine: "شارع الجيش، عمارة 21، شقة 3",
    status: "packed",
    daysAgo: 5,
    items: [
      { slug: "body-butter-sexy", quantity: 1 },
      { slug: "body-lotion-sexy", quantity: 1 },
    ],
  }),
  buildOrder(5, {
    customerName: "مي كريم",
    customerPhone: "+201022345678",
    governorateCode: "ASY",
    city: "أسيوط",
    addressLine: "شارع الجمهورية، عمارة 8، شقة 2",
    status: "shipped",
    daysAgo: 7,
    items: [
      { slug: "body-butter-queen", quantity: 1 },
      { slug: "hair-mist-queen", quantity: 1 },
    ],
    carrier: "Bosta",
    tracking: "TRK-BOSTA-48213",
  }),
  buildOrder(6, {
    customerName: "هبة طارق",
    customerPhone: "+201033345678",
    governorateCode: "CAI",
    city: "المعادي",
    addressLine: "شارع 9، عمارة 5، شقة 11",
    status: "delivered",
    daysAgo: 12,
    items: [{ slug: "body-lotion-queen", quantity: 2 }],
    carrier: "REEVITA Express",
  }),
  buildOrder(7, {
    customerName: "ريم أحمد",
    customerPhone: "+201044456789",
    governorateCode: "PTS",
    city: "بورسعيد",
    addressLine: "شارع الجمهورية، عمارة 30",
    status: "cancelled",
    daysAgo: 9,
    items: [{ slug: "shampoo-blueberry", quantity: 1 }],
  }),
  buildOrder(8, {
    customerName: "دينا مصطفى",
    customerPhone: "+201055567891",
    governorateCode: "SHG",
    city: "سوهاج",
    addressLine: "شارع 15، عمارة 2، شقة 6",
    status: "refused",
    daysAgo: 14,
    items: [{ slug: "body-splash-queen", quantity: 1 }],
    carrier: "Aramex",
  }),
  buildOrder(9, {
    customerName: "مريم عادل",
    customerPhone: "+201066678912",
    customerEmail: "mariam@example.com",
    governorateCode: "GIZ",
    city: "الشيخ زايد",
    addressLine: "الحي الأول، عمارة 18، شقة 5",
    status: "delivered",
    daysAgo: 20,
    items: [
      { slug: "body-butter-ruby-musk", quantity: 1 },
      { slug: "hair-mist-ruby-musk", quantity: 1 },
    ],
    carrier: "REEVITA Express",
  }),
  buildOrder(10, {
    customerName: "فرح وليد",
    customerPhone: "+201077789123",
    governorateCode: "MAT",
    city: "مرسى مطروح",
    addressLine: "شارع الإسكندرية، عمارة 6",
    status: "new",
    daysAgo: 1,
    items: [{ slug: "body-lotion-ruby-musk", quantity: 1 }],
  }),
];

let orderSequence = orders.length;

/** Mirrors the production idempotency key so a retried demo submission is not duplicated. */
const idempotentDemoOrders = new Map<string, PlacedOrder>();

export function demoOrders(): DemoOrder[] {
  return [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function demoPlaceOrder(input: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  governorateId: string;
  city: string;
  addressLine: string;
  landmark?: string | null;
  orderNotes?: string | null;
  items: { product_id: string; quantity: number }[];
  idempotencyKey?: string;
}): PlacedOrder {
  const replayKey = input.idempotencyKey?.trim();
  if (replayKey) {
    const replay = idempotentDemoOrders.get(replayKey);
    if (replay) return replay;
  }

  const governorate = demoGovernorates().find((gov) => gov.id === input.governorateId);
  if (!governorate) throw new Error("INVALID_LOCATION: Selected governorate is invalid");

  const normalizedPhone = normalizeEgyptianPhone(input.customerPhone);
  if (!normalizedPhone) throw new Error("INVALID_PHONE: Invalid Egyptian phone number");
  if (input.customerName.trim().length < 2) throw new Error("INVALID_INPUT: Customer name too short");
  if (input.addressLine.trim().length < 5) throw new Error("INVALID_INPUT: Address too short");
  if (input.city.trim().length < 2) throw new Error("INVALID_INPUT: City required");

  const items = input.items.map((item) => {
    const product = staticProducts.find((candidate) => candidate.id === item.product_id);
    if (!product) throw new Error("PRODUCT_UNAVAILABLE: Product not found");
    const record = stock.get(product.id);
    if (!record || record.quantity < item.quantity) {
      throw new Error(`INSUFFICIENT_STOCK: Product "${product.nameAr}" is out of stock`);
    }
    return { product, quantity: item.quantity };
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= governorate.freeShippingThreshold ? 0 : governorate.shippingCost;
  const total = subtotal + shippingFee;
  orderSequence += 1;
  const createdAt = new Date().toISOString();
  const order: DemoOrder = {
    id: `99999999-0000-0000-0000-${String(orderSequence).padStart(12, "0")}`,
    orderNumber: `RV-2026-${String(10000 + orderSequence)}`,
    customerName: input.customerName.trim(),
    customerPhone: normalizedPhone,
    customerEmail: input.customerEmail ?? null,
    governorateId: governorate.id,
    governorateAr: governorate.nameAr,
    city: input.city.trim(),
    addressLine: input.addressLine.trim(),
    landmark: input.landmark ?? null,
    notes: input.orderNotes ?? null,
    status: "new",
    paymentMethod: "cod",
    paymentStatus: "pending",
    subtotal,
    shippingFee,
    codFee: 0,
    total,
    currency: "EGP",
    shippingCarrier: null,
    trackingNumber: null,
    createdAt,
    items: items.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.nameEn,
      nameAr: product.nameAr,
      image: product.images[0]?.url ?? "",
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
    })),
    history: [{ from: null, to: "new", reason: "Order created", at: createdAt }],
  };

  items.forEach(({ product, quantity }) => {
    const record = stock.get(product.id);
    if (record) record.quantity = Math.max(0, record.quantity - quantity);
  });

  orders.push(order);
  const placed = toPlacedOrder(order);
  if (replayKey) idempotentDemoOrders.set(replayKey, placed);
  return placed;
}

export function toPlacedOrder(order: DemoOrder): PlacedOrder {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt,
    governorateAr: order.governorateAr,
    items: order.items.map((item) => ({
      productName: item.nameAr,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

export function demoOrder(orderNumber: string): DemoOrder | undefined {
  return orders.find((order) => order.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase());
}

export function demoTrackOrder(orderNumber: string, phone: string): TrackedOrder {
  const normalized = normalizeEgyptianPhone(phone);
  const order = demoOrder(orderNumber);
  if (!order || !normalized || order.customerPhone !== normalized) {
    return {
      found: false,
      messageAr: "لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.",
    };
  }
  return {
    found: true,
    orderNumber: order.orderNumber,
    status: order.status,
    statusAr: STATUS_META[order.status].descriptionAr,
    shippingCarrier: order.shippingCarrier ?? "REEVITA Express",
    trackingNumber: order.trackingNumber,
    destinationGovernorate: order.governorateAr,
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt,
  };
}

export function demoCustomerOrders(email: string | null | undefined, phone?: string | null): DemoOrder[] {
  if (!email && !phone) return [];
  const normalized = phone ? normalizeEgyptianPhone(phone) : null;
  return demoOrders().filter(
    (order) =>
      (email && order.customerEmail?.toLowerCase() === email.toLowerCase()) ||
      (normalized && order.customerPhone === normalized),
  );
}

export function demoUpdateOrderStatus(input: {
  orderId: string;
  newStatus: OrderStatus;
  reason?: string;
  carrier?: string;
  trackingNumber?: string;
}): DemoOrder | null {
  const order = orders.find((candidate) => candidate.id === input.orderId);
  if (!order) return null;
  const from = order.status;
  order.status = input.newStatus;
  if (input.carrier) order.shippingCarrier = input.carrier;
  if (input.trackingNumber) order.trackingNumber = input.trackingNumber;
  if (input.newStatus === "delivered") order.paymentStatus = "paid";
  order.history.push({
    from,
    to: input.newStatus,
    reason: input.reason ?? `Status changed to ${input.newStatus}`,
    at: new Date().toISOString(),
  });
  return order;
}

export function demoUpdateInventory(productId: string, quantity: number, threshold?: number): boolean {
  const record = stock.get(productId);
  if (!record) return false;
  record.quantity = quantity;
  if (typeof threshold === "number") record.threshold = threshold;
  return true;
}

export function demoUpdateShippingRate(governorateId: string, _cost: number, _threshold: number): boolean {
  // Demo shipping rates are derived from zone defaults; nothing to persist.
  return demoGovernorates().some((gov) => gov.id === governorateId);
}

export function demoMetrics() {
  const all = orders;
  const active = all.filter((order) => !["cancelled", "refused", "returned"].includes(order.status));
  const delivered = all.filter((order) => order.status === "delivered").length;
  const refused = all.filter((order) => order.status === "refused").length;
  const statusCounts: Record<string, number> = {};
  all.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
  });
  const lowStock = demoInventory().filter((item) => item.quantityAvailable <= item.lowStockThreshold);
  const revenue = active.reduce((sum, order) => sum + order.total, 0);
  return {
    total_orders: active.length,
    total_sales_egp: revenue,
    orders_by_status: statusCounts,
    delivered_count: delivered,
    refused_count: refused,
    refusal_rate_percentage:
      delivered + refused > 0 ? Math.round((refused / (delivered + refused)) * 10000) / 100 : 0,
    low_stock_count: lowStock.length,
    low_stock_items: lowStock.map((item) => ({
      product_id: item.productId,
      name: item.name,
      name_ar: item.nameAr,
      quantity_available: item.quantityAvailable,
      low_stock_threshold: item.lowStockThreshold,
    })),
    average_order_value:
      active.length > 0 ? Math.round((revenue / active.length) * 100) / 100 : 0,
    recent_orders: demoOrders().slice(0, 5),
  };
}

export function demoAuditLog() {
  return demoOrders()
    .slice(0, 6)
    .flatMap((order) => [
      {
        id: `${order.id}-created`,
        action: "CREATE_ORDER",
        entity: "orders",
        entityId: order.orderNumber,
        details: { total: order.total, status: order.status },
        createdAt: order.createdAt,
      },
    ]);
}

export { staticProducts };
