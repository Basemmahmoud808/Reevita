/** Shared domain types for the REEVITA storefront. */

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  descriptionAr: string;
  price: number;
  compareAtPrice: number | null;
  size: string;
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  fragranceSlug: string;
  fragranceNameAr: string;
  fragranceNameEn: string;
  variantLabelAr: string | null;
  benefits: string[];
  ingredientsAr: string;
  howToUseAr: string;
  images: ProductImage[];
  rating: number;
  reviews: number;
  stockStatus: StockStatus;
  isFeatured: boolean;
  isNew: boolean;
  badge: string | null;
  /** Catalogue-only seed quantity (demo mode); never exposed from Supabase. */
  initialStock?: number;
}

export interface Category {
  slug: string;
  nameAr: string;
  nameEn: string;
  shortAr: string;
  descriptionAr: string;
  image: string;
  displayOrder: number;
}

export interface Fragrance {
  slug: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  notesAr: string[];
  moodAr: string;
  descriptionAr: string;
  color: string;
  accent: string;
  image: string;
  displayOrder: number;
}

export interface Brand {
  name: string;
  nameAr: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  supportPhone: string;
  supportPhoneDisplay: string;
  whatsapp: string;
  email: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  country: string;
  currency: string;
  freeShippingThreshold: number;
  codFee: number;
  returnWindowDays: number;
  deliveryEstimateAr: string;
  addressAr: string;
  launchYear: number;
}

export interface Testimonial {
  name: string;
  city: string;
  quote: string;
  rating: number;
  product: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  nameAr: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  size: string;
  variantLabelAr: string | null;
  quantity: number;
  maxQuantity: number;
}

export interface Governorate {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  zone: string;
  shippingCost: number;
  freeShippingThreshold: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  governorateId: string;
  city: string;
  addressLine: string;
  landmark?: string | null;
  orderNotes?: string | null;
  items: { product_id: string; quantity: number }[];
}

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  total: number;
  currency: string;
  createdAt: string;
  items?: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  governorateAr?: string;
  /** True when an identical checkout attempt was replayed instead of creating a new order. */
  replayed?: boolean;
}

/** Authoritative, phone-verified receipt used by the confirmation page. */
export interface OrderReceipt extends PlacedOrder {
  found: boolean;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "refused"
  | "returned"
  | "cancelled";

export interface TrackedOrder {
  found: boolean;
  orderNumber?: string;
  status?: OrderStatus;
  statusAr?: string;
  shippingCarrier?: string;
  trackingNumber?: string | null;
  destinationGovernorate?: string;
  total?: number;
  currency?: string;
  createdAt?: string;
  messageAr?: string;
}
