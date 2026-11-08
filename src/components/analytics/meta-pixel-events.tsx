"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

export interface ViewContentProduct {
  id: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  categoryNameAr?: string;
  categoryNameEn?: string;
}

export function MetaPixelViewContent({ product }: { product: ViewContentProduct }) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: product.nameAr,
      content_category: product.categoryNameAr || product.categoryNameEn || "Cosmetics",
      content_ids: [product.id],
      content_type: "product",
      value: product.price,
      currency: "EGP",
    });
  }, [product]);

  return null;
}

export interface PurchaseOrder {
  orderNumber: string;
  total: number;
  items?: Array<{
    productId?: string;
    product_id?: string;
    nameAr?: string;
    quantity?: number;
    price?: number;
  }>;
}

export function MetaPixelPurchase({ order }: { order: PurchaseOrder }) {
  useEffect(() => {
    try {
      const storageKey = `rv_pixel_purchased_${order.orderNumber}`;
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");

      const contentIds = (order.items || [])
        .map((item) => item.productId || item.product_id)
        .filter((id): id is string => Boolean(id));

      const numItems = (order.items || []).reduce(
        (sum, item) => sum + (item.quantity ?? 1),
        0,
      );

      trackMetaEvent("Purchase", {
        content_type: "product",
        content_ids: contentIds,
        value: order.total,
        currency: "EGP",
        num_items: numItems > 0 ? numItems : 1,
      });
    } catch {
      // In case sessionStorage is blocked or unavailable
      trackMetaEvent("Purchase", {
        content_type: "product",
        value: order.total,
        currency: "EGP",
      });
    }
  }, [order]);

  return null;
}
