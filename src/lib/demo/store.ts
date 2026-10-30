import { featuredCollections, staticProducts } from "@/lib/catalog";
import { normalizeEgyptianPhone } from "@/lib/phone";
import type {
  Governorate,
  OrderStatus,
  PlacedOrder,
  Product,
  StockStatus,
  TrackedOrder,
  Collection,
} from "@/lib/types";
import { STATUS_META } from "@/lib/orders/status";
import { getCuratedOfferDefinition } from "@/lib/curated-collections";

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
  greater_cairo: [2, 3],
  alexandria: [2, 3],
  delta: [2, 3],
  canal: [2, 3],
  upper_egypt: [2, 3],
  frontier: [2, 3],
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
    estimatedDaysMax: zoneDays[zone]?.[1] ?? 3,
  }));
}

interface DemoStock {
  quantity: number;
  threshold: number;
}

const stock: Map<string, DemoStock> = new Map(
  staticProducts.map((product) => [product.id, { quantity: product.initialStock ?? 0, threshold: 5 }]),
);

const collections: Map<string, Collection> = new Map(
  featuredCollections.map((collection) => [collection.id, { ...collection, productIds: [...(collection.productIds ?? [])] }]),
);

export function demoCollections(): Collection[] {
  return [...collections.values()]
    .filter((collection) => collection.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((collection) => ({ ...collection, productIds: [...(collection.productIds ?? [])], productQuantities: { ...(collection.productQuantities ?? {}) } }));
}

export function demoAllCollections(): Collection[] {
  return [...collections.values()]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((collection) => ({ ...collection, productIds: [...(collection.productIds ?? [])], productQuantities: { ...(collection.productQuantities ?? {}) } }));
}

export function demoCreateCollection(input: Omit<Collection, "id">): void {
  const id = `demo-collection-${crypto.randomUUID()}`;
  collections.set(id, { ...input, id, productIds: [...(input.productIds ?? [])], productQuantities: { ...(input.productQuantities ?? {}) } });
}

export function demoUpdateCollection(id: string, patch: Partial<Omit<Collection, "id">>): boolean {
  const current = collections.get(id);
  if (!current) return false;
  collections.set(id, { ...current, ...patch, id, productIds: patch.productIds ? [...patch.productIds] : current.productIds, productQuantities: patch.productQuantities ? { ...patch.productQuantities } : current.productQuantities });
  return true;
}

export function demoDeleteCollection(id: string): boolean {
  return collections.delete(id);
}

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
  discountAmount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  currency: "EGP";
  shippingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: DemoOrderItem[];
  history: { from: OrderStatus | null; to: OrderStatus; reason: string; at: string }[];
  idempotencyKey?: string | null;
}

const orders: DemoOrder[] = [];

let orderSequence = 0;
const blockedPhones = new Set<string>();

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
  curatedOffers?: { offerKey: string; quantity: number }[];
  idempotencyKey?: string | null;
}): PlacedOrder {
  if (input.idempotencyKey) {
    const existing = orders.find((o) => o.idempotencyKey && o.idempotencyKey === input.idempotencyKey);
    if (existing) return { ...toPlacedOrder(existing), isDuplicate: true };
  }

  const governorate = demoGovernorates().find((gov) => gov.id === input.governorateId);
  if (!governorate) throw new Error("INVALID_LOCATION: Selected governorate is invalid");

  const normalizedPhone = normalizeEgyptianPhone(input.customerPhone);
  if (!normalizedPhone) throw new Error("INVALID_PHONE: Invalid Egyptian phone number");
  if (blockedPhones.has(normalizedPhone)) {
    throw new Error("ORDER_REJECTED: Account or phone number is restricted. Please contact customer support.");
  }
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
  const quantitiesBySlug = new Map(items.map(({ product, quantity }) => [product.slug, quantity]));
  const claimedBySlug = new Map<string, number>();
  let discountAmount = 0;
  for (const offer of input.curatedOffers ?? []) {
    const definition = getCuratedOfferDefinition(offer.offerKey);
    if (!definition || offer.quantity < 1 || offer.quantity > 10) throw new Error("INVALID_BUNDLE_OFFER: Invalid collection discount");
    const requirements = new Map<string, number>();
    for (const slug of definition.productSlugs) requirements.set(slug, (requirements.get(slug) ?? 0) + offer.quantity);
    for (const [slug, required] of requirements) {
      const next = (claimedBySlug.get(slug) ?? 0) + required;
      if (next > (quantitiesBySlug.get(slug) ?? 0)) throw new Error("INVALID_BUNDLE_OFFER: Collection contents do not match the bag");
      claimedBySlug.set(slug, next);
    }
    const productBySlug = new Map(items.map(({ product }) => [product.slug, product]));
    const offerTotal = definition.productSlugs.reduce((sum, slug) => sum + (productBySlug.get(slug)?.price ?? 0), 0) * offer.quantity;
    discountAmount += Math.round(offerTotal * definition.discountPercent / 100);
  }
  const shippingFee = subtotal >= governorate.freeShippingThreshold ? 0 : governorate.shippingCost;
  const total = subtotal - discountAmount + shippingFee;
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
    discountAmount,
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
    idempotencyKey: input.idempotencyKey ?? null,
  };

  items.forEach(({ product, quantity }) => {
    const record = stock.get(product.id);
    if (record) record.quantity = Math.max(0, record.quantity - quantity);
  });

  orders.push(order);
  return toPlacedOrder(order);
}

export function toPlacedOrder(order: DemoOrder): PlacedOrder {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
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
  if (input.newStatus === "refused") blockedPhones.add(order.customerPhone);
  if (["cancelled", "refused", "returned"].includes(input.newStatus) && !["cancelled", "refused", "returned"].includes(from)) {
    order.items.forEach((item) => {
      const record = stock.get(item.productId);
      if (record) record.quantity += item.quantity;
    });
  }
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
