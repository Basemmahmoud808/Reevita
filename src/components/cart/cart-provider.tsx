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
import type { CartLine, Product } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

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
  if (Array.isArray(value)) return { lines: sanitizeLines(value), curatedOffers: [] };
  if (!value || typeof value !== "object") return { lines: [], curatedOffers: [] };
  const stored = value as Partial<CartState>;
  const lines = sanitizeLines(stored.lines);
  return { lines, curatedOffers: pruneOffers(sanitizeOffers(stored.curatedOffers), lines) };
}

function getDiscountBreakdown(offers: CuratedOfferSelection[], lines: CartLine[]) {
  const lineBySlug = new Map(lines.map((line) => [line.slug, line]));
  const covered = new Map<string, number>();
  const bundleDiscountAmount = offers.reduce((sum, offer) => {
    const definition = getCuratedOfferDefinition(offer.offerKey);
    if (!definition) return sum;
    for (const slug of definition.productSlugs) covered.set(slug, (covered.get(slug) ?? 0) + offer.quantity);
    const offerTotal = definition.productSlugs.reduce(
      (offerSum, slug) => offerSum + (lineBySlug.get(slug)?.price ?? 0),
      0,
    ) * offer.quantity;
    return sum + Math.round(offerTotal * definition.discountPercent / 100);
  }, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const volumeDiscountPercent = count >= 3 ? 15 : count === 2 ? 11 : 0;
  const uncoveredSubtotal = lines.reduce((sum, line) =>
    sum + line.price * Math.max(0, line.quantity - (covered.get(line.slug) ?? 0)), 0);
  const volumeDiscountAmount = Math.round(uncoveredSubtotal * volumeDiscountPercent / 100);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountAmount = Math.min(bundleDiscountAmount + volumeDiscountAmount, subtotal);
  return { discountAmount, bundleDiscountAmount, volumeDiscountAmount, volumeDiscountPercent };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartState>({ lines: [], curatedOffers: [] });
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
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines) };
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
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines) };
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
      return { lines, curatedOffers: pruneOffers(offers, lines) };
    });
    toast("أُضيفت المجموعة بخصمها إلى سلة المشتريات.");
    setIsOpen(true);
  }, [toast]);

  const removeItem = useCallback((productId: string) => {
    setCart((current) => {
      const lines = current.lines.filter((line) => line.productId !== productId);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines) };
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) => {
      const lines = current.lines
        .map((line) => line.productId === productId
          ? { ...line, quantity: Math.min(Math.max(1, Math.round(quantity)), MAX_QUANTITY) }
          : line,
        )
        .filter((line) => line.quantity > 0);
      return { lines, curatedOffers: pruneOffers(current.curatedOffers, lines) };
    });
  }, []);

  const clear = useCallback(() => setCart({ lines: [], curatedOffers: [] }), []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.price * line.quantity, 0), [lines]);
  const discounts = useMemo(() => getDiscountBreakdown(curatedOffers, lines), [curatedOffers, lines]);
  const { discountAmount, bundleDiscountAmount, volumeDiscountAmount, volumeDiscountPercent } = discounts;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
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
