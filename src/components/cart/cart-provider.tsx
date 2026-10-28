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
>;

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  freeShippingRemaining: number;
  freeShippingThreshold: number;
  ready: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: AddableProduct, quantity?: number) => void;
  addItems: (products: AddableProduct[], quantity?: number) => void;
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
      const names = canonicalProductNames({
        slug: line.slug,
        size: line.size,
        variantLabelAr: line.variantLabelAr,
        nameAr: line.nameAr,
      });
      return {
        ...line,
        nameAr: names.nameAr,
        quantity: Math.min(Math.max(1, Math.round(line.quantity)), MAX_QUANTITY),
        maxQuantity: MAX_QUANTITY,
      };
    });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // Hydrating from localStorage must happen after mount so the server-rendered
      // empty cart stays deterministic (no hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(sanitizeLines(JSON.parse(raw)));
    } catch {
      // Corrupted storage — start clean rather than crash the storefront.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be full/blocked (private mode); the cart still works in-memory.
    }
  }, [lines, ready]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setLines(sanitizeLines(JSON.parse(event.newValue)));
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

  const addItem = useCallback(
    (product: AddableProduct, quantity = 1) => {
      if (product.stockStatus === "out_of_stock") {
        toast("هذا المنتج نفد مؤقتًا من المخزون.", "error");
        return;
      }
      setLines((current) => {
        const existing = current.find((line) => line.productId === product.id);
        if (existing) {
          const nextQuantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
          if (nextQuantity === existing.quantity) {
            toast("وصلتِ للحد الأقصى للكمية المسموح بها.", "info");
            return current;
          }
          return current.map((line) =>
            line.productId === product.id ? { ...line, quantity: nextQuantity } : line,
          );
        }
        return [
          ...current,
          {
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
          },
        ];
      });
      toast("أُضيف المنتج إلى سلة المشتريات.");
      setIsOpen(true);
    },
    [toast],
  );

  const addItems = useCallback(
    (products: AddableProduct[], quantity = 1) => {
      const availableProducts = products.filter((product) => product.stockStatus !== "out_of_stock");
      if (availableProducts.length === 0) {
        toast("لا توجد منتجات متاحة للإضافة من هذه المجموعة.", "error");
        return;
      }

      setLines((current) => {
        let next = [...current];
        for (const product of availableProducts) {
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
      });
      const skipped = products.length - availableProducts.length;
      toast(
        skipped > 0
          ? `تمت إضافة ${availableProducts.length} منتجات، وتم تخطي ${skipped} غير متاح.`
          : `تمت إضافة ${availableProducts.length} منتجات إلى السلة.`,
        skipped > 0 ? "info" : "success",
      );
      setIsOpen(true);
    },
    [toast],
  );

  const removeItem = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(Math.max(1, Math.round(quantity)), MAX_QUANTITY) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.price * line.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const freeShippingThreshold = brand.freeShippingThreshold;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal);

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      freeShippingRemaining,
      freeShippingThreshold,
      ready,
      isOpen,
      openCart,
      closeCart,
      addItem,
      addItems,
      removeItem,
      setQuantity,
      clear,
    }),
    [
      lines,
      count,
      subtotal,
      freeShippingRemaining,
      freeShippingThreshold,
      ready,
      isOpen,
      openCart,
      closeCart,
      addItem,
      addItems,
      removeItem,
      setQuantity,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
