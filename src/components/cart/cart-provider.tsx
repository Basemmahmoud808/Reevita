"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { brand } from "@/lib/catalog";
import { canonicalProductNames } from "@/lib/product-names";
import { getCuratedOfferDefinition } from "@/lib/curated-collections";
import { freeGiftSlots } from "@/lib/promotions";
import type { CartLine, Product } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

const STORAGE_KEY = "rv_cart_v1";
const MAX_QUANTITY = 10;

export type AddableProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "nameAr"
  | "nameEn"
  | "price"
  | "compareAtPrice"
  | "size"
  | "variantLabelAr"
  | "images"
  | "stockStatus"
  | "sizeOptions"
>;

export interface CuratedOfferSelection {
  offerKey: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  curatedOffers: CuratedOfferSelection[];
  giftQuantities: Record<string, number>;
}

function calculateGiftQuantities(lines: CartLine[], giftSlots: number) {
  const gifts: Record<string, number> = {};
  let remaining = giftSlots;
  for (const line of [...lines].sort((a, b) => a.price - b.price)) {
    if (remaining === 0) break;
    const quantity = Math.min(line.quantity, remaining);
    if (quantity > 0) gifts[line.productId] = quantity;
    remaining -= quantity;
  }
  return gifts;
}

interface CartContextValue {
  lines: CartLine[];
  curatedOffers: CuratedOfferSelection[];
  count: number;
  subtotal: number;
  discountAmount: number;
  bundleDiscountAmount: number;
  volumeDiscountAmount: number;
  volumeDiscountPercent: number;
  giftDiscountAmount: number;
  giftQuantities: Record<string, number>;
  giftCount: number;
  giftSlots: number;
  subtotalAfterDiscount: number;
  freeShippingRemaining: number;
  freeShippingThreshold: number;
  ready: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: AddableProduct, quantity?: number) => void;
  addItems: (products: AddableProduct[], quantity?: number) => void;
  addCuratedItems: (products: AddableProduct[], offerKey: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setGiftQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line): line is CartLine => {
      if (!line || typeof line !== "object") return false;
      const candidate = line as Partial<CartLine>;
      return (
        typeof candidate.productId === "string" &&
        typeof candidate.slug === "string" &&
        typeof candidate.nameAr === "string" &&
        typeof candidate.price === "number" &&
        typeof candidate.quantity === "number" &&
        candidate.quantity > 0
      );
    })
    .slice(0, 30)
    .map((line) => {
      const names = canonicalProductNames({ slug: line.slug, nameAr: line.nameAr });
      return {
        ...line,
        nameAr: names.nameAr,
        quantity: Math.min(Math.max(1, Math.round(line.quantity)), MAX_QUANTITY),
        maxQuantity: MAX_QUANTITY,
      };
    });
}

function sanitizeOffers(value: unknown): CuratedOfferSelection[] {
  if (!Array.isArray(value)) return [];
  const byKey = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<CuratedOfferSelection>;
    if (typeof candidate.offerKey !== "string" || !getCuratedOfferDefinition(candidate.offerKey)) continue;
    const quantity = Math.min(MAX_QUANTITY, Math.max(1, Math.round(Number(candidate.quantity) || 1)));
    byKey.set(candidate.offerKey, Math.min(MAX_QUANTITY, (byKey.get(candidate.offerKey) ?? 0) + quantity));
  }
  return [...byKey].map(([offerKey, quantity]) => ({ offerKey, quantity }));
}

function pruneOffers(offers: CuratedOfferSelection[], lines: CartLine[]): CuratedOfferSelection[] {
  const available = new Map<string, number>();
  for (const line of lines) available.set(line.slug, (available.get(line.slug) ?? 0) + line.quantity);
  const claimed = new Map<string, number>();
  const result: CuratedOfferSelection[] = [];

  for (const offer of offers) {
    const definition = getCuratedOfferDefinition(offer.offerKey);
    if (!definition || definition.discountPercent <= 0) continue;
    const requirements = new Map<string, number>();
    for (const slug of definition.productSlugs) requirements.set(slug, (requirements.get(slug) ?? 0) + 1);

    let acceptedQuantity = 0;
    for (let quantity = 0; quantity < offer.quantity; quantity += 1) {
      const fits = [...requirements].every(([slug, perOffer]) =>
        (claimed.get(slug) ?? 0) + perOffer <= (available.get(slug) ?? 0),
      );
      if (!fits) break;
      acceptedQuantity += 1;
      for (const [slug, perOffer] of requirements) {
        claimed.set(slug, (claimed.get(slug) ?? 0) + perOffer);
      }
    }
    if (acceptedQuantity > 0) result.push({ offerKey: offer.offerKey, quantity: acceptedQuantity });
  }

  return result;
}

function addProducts(lines: CartLine[], products: AddableProduct[], quantity = 1): CartLine[] {
  let next = [...lines];
  for (const product of products) {
    const existing = next.find((line) => line.productId === product.id);
    if (existing) {
      const nextQuantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
      next = next.map((line) => line.productId === product.id ? { ...line, quantity: nextQuantity } : line);
      continue;
    }
    next.push({
      productId: product.id,
      slug: product.slug,
      nameAr: product.nameAr,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images[0]?.url ?? "",
      size: product.size,
      variantLabelAr: product.variantLabelAr,
      quantity: Math.min(Math.max(1, quantity), MAX_QUANTITY),
      maxQuantity: MAX_QUANTITY,
    });
  }
  return next;
}

function sanitizeCart(value: unknown): CartState {
  // The original storage format was just an array of lines. Keep old customer bags intact.
  if (Array.isArray(value)) return { lines: sanitizeLines(value), curatedOffers: [], giftQuantities: {} };
  if (!value || typeof value !== "object") return { lines: [], curatedOffers: [], giftQuantities: {} };
  const stored = value as Partial<CartState>;
  const lines = sanitizeLines(stored.lines);
  return { lines, curatedOffers: pruneOffers(sanitizeOffers(stored.curatedOffers), lines), giftQuantities: {} };
}

function getDiscountBreakdown(offers: CuratedOfferSelection[], lines: CartLine[]) {
  void offers;
  void lines;
  return { discountAmount: 0, bundleDiscountAmount: 0, volumeDiscountAmount: 0, volumeDiscountPercent: 0 };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartState>({ lines: [], curatedOffers: [], giftQuantities: {} });
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { lines, curatedOffers } = cart;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hydrate only after mount so the initial server render stays deterministic.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCart(sanitizeCart(JSON.parse(raw)));
    } catch {
      // Corrupted storage — start clean rather than crash the storefront.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Storage can be full or blocked; the bag still works in memory.
    }
  }, [cart, ready]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setCart(sanitizeCart(JSON.parse(event.newValue)));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: AddableProduct, quantity = 1) => {
    if (product.stockStatus === "out_of_stock") {
      toast("هذا المنتج نفد مؤقتًا من المخزون.", "error");
      return;
    }
    setCart((current) => {
      const existing = current.lines.find((line) => line.productId === product.id);
      if (existing && existing.quantity >= MAX_QUANTITY) {
        toast("وصلتِ للحد الأقصى للكمية المسموح بها.", "info");
        return current;
      }
      const lines = addProducts(current.lines, [product], quantity);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines), giftQuantities: current.giftQuantities };
    });
    trackMetaEvent("AddToCart", {
      content_name: product.nameAr,
      content_ids: [product.id],
      content_type: "product",
      value: product.price * quantity,
      currency: "EGP",
    });
    toast("أُضيف المنتج إلى سلة المشتريات.");
    setIsOpen(true);
  }, [toast]);

  const addItems = useCallback((products: AddableProduct[], quantity = 1) => {
    const availableProducts = products.filter((product) => product.stockStatus !== "out_of_stock");
    if (availableProducts.length === 0) {
      toast("لا توجد منتجات متاحة للإضافة من هذه المجموعة.", "error");
      return;
    }

    setCart((current) => {
      const lines = addProducts(current.lines, availableProducts, quantity);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines), giftQuantities: current.giftQuantities };
    });
    trackMetaEvent("AddToCart", {
      content_name: availableProducts.map((p) => p.nameAr).join(", "),
      content_ids: availableProducts.map((p) => p.id),
      content_type: "product",
      value: availableProducts.reduce((sum, p) => sum + p.price * quantity, 0),
      currency: "EGP",
    });
    const skipped = products.length - availableProducts.length;
    toast(
      skipped > 0
        ? `تمت إضافة ${availableProducts.length} منتجات، وتم تخطي ${skipped} غير متاح.`
        : `تمت إضافة ${availableProducts.length} منتجات إلى السلة.`,
      skipped > 0 ? "info" : "success",
    );
    setIsOpen(true);
  }, [toast]);

  const addCuratedItems = useCallback((products: AddableProduct[], offerKey: string) => {
    const unavailable = products.find((product) => product.stockStatus === "out_of_stock");
    if (unavailable) {
      toast(`${unavailable.nameAr} غير متاح حاليًا، لذلك لم تتم إضافة المجموعة.`, "error");
      return;
    }
    if (!getCuratedOfferDefinition(offerKey)) {
      toast("تعذّرت إضافة العرض. حدّث الصفحة ثم حاول مرة أخرى.", "error");
      return;
    }

    setCart((current) => {
      const lines = addProducts(current.lines, products);
      const offers = sanitizeOffers([
        ...current.curatedOffers,
        { offerKey, quantity: 1 },
      ]);
      return { lines, curatedOffers: pruneOffers(offers, lines), giftQuantities: current.giftQuantities };
    });
    trackMetaEvent("AddToCart", {
      content_name: products.map((p) => p.nameAr).join(", "),
      content_ids: products.map((p) => p.id),
      content_type: "product",
      value: products.reduce((sum, p) => sum + p.price, 0),
      currency: "EGP",
    });
    toast("أُضيفت المجموعة بخصمها إلى سلة المشتريات.");
    setIsOpen(true);
  }, [toast]);

  const removeItem = useCallback((productId: string) => {
    setCart((current) => {
      const lines = current.lines.filter((line) => line.productId !== productId);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines), giftQuantities: current.giftQuantities };
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => {
      const existing = current.lines.find((line) => line.productId === productId);
      const clamped = Math.min(Math.max(1, Math.round(quantity)), MAX_QUANTITY);
      if (existing && clamped > existing.quantity) {
        const addedQty = clamped - existing.quantity;
        trackMetaEvent("AddToCart", {
          content_name: existing.nameAr,
          content_ids: [existing.productId],
          content_type: "product",
          value: existing.price * addedQty,
          currency: "EGP",
        });
      }
      const lines = current.lines
        .map((line) => line.productId === productId
          ? { ...line, quantity: clamped }
          : line,
        )
        .filter((line) => line.quantity > 0);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines), giftQuantities: current.giftQuantities };
    });
  }, []);

  const clear = useCallback(() => setCart({ lines: [], curatedOffers: [], giftQuantities: {} }), []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.price * line.quantity, 0), [lines]);
  const discounts = useMemo(() => getDiscountBreakdown(curatedOffers, lines), [curatedOffers, lines]);
  const { discountAmount, bundleDiscountAmount, volumeDiscountAmount, volumeDiscountPercent } = discounts;
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const giftSlots = freeGiftSlots(count);
  const giftQuantities = useMemo(
    () => calculateGiftQuantities(lines, giftSlots),
    [lines, giftSlots],
  );
  const giftCount = Object.values(giftQuantities).reduce((sum, quantity) => sum + quantity, 0);
  const giftDiscountAmount = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * (giftQuantities[line.productId] ?? 0), 0),
    [lines, giftQuantities],
  );
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount - giftDiscountAmount);
  const setGiftQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => {
      const line = current.lines.find((item) => item.productId === productId);
      if (!line) return current;
      const otherGifts = Object.entries(current.giftQuantities)
        .filter(([id]) => id !== productId)
        .reduce((sum, [, value]) => sum + value, 0);
      const nextQuantity = Math.min(line.quantity, Math.max(0, Math.min(quantity, giftSlots - otherGifts)));
      return {
        ...current,
        giftQuantities: { ...current.giftQuantities, [productId]: nextQuantity },
      };
    });
  }, [giftSlots]);
  const freeShippingThreshold = brand.freeShippingThreshold;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  const value = useMemo(
    () => ({
      lines,
      curatedOffers,
      count,
      subtotal,
      discountAmount,
      bundleDiscountAmount,
      volumeDiscountAmount,
      volumeDiscountPercent,
      giftDiscountAmount,
      giftQuantities,
      giftCount,
      giftSlots,
      subtotalAfterDiscount,
      freeShippingRemaining,
      freeShippingThreshold,
      ready,
      isOpen,
      openCart,
      closeCart,
      addItem,
      addItems,
      addCuratedItems,
      removeItem,
      setQuantity,
      setGiftQuantity,
      clear,
    }),
    [
      lines,
      curatedOffers,
      count,
      subtotal,
      discountAmount,
      bundleDiscountAmount,
      volumeDiscountAmount,
      volumeDiscountPercent,
      giftDiscountAmount,
      giftQuantities,
      giftCount,
      giftSlots,
      subtotalAfterDiscount,
      freeShippingRemaining,
      freeShippingThreshold,
      ready,
      isOpen,
      openCart,
      closeCart,
      addItem,
      addItems,
      addCuratedItems,
      removeItem,
      setQuantity,
      setGiftQuantity,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
