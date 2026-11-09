"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // The inline <head> script already fired browser fbq('track', 'PageView') on initial load;
      // send the matching server-side CAPI PageView event.
      fetch("/api/analytics/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "PageView",
          eventId: `pageview_${Date.now()}`,
          eventSourceUrl: window.location.href,
        }),
        keepalive: true,
      }).catch(() => {});
    } else {
      // On SPA client-side route transitions, fire both browser fbq and server CAPI PageView.
      trackMetaEvent("PageView", { page_path: fullPath });
    }
  }, [pathname, searchParams]);

  // Global listener for WhatsApp, Phone, and Email contact interactions
  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.includes("wa.me") || href.startsWith("tel:") || href.startsWith("mailto:")) {
        const method = href.includes("wa.me")
          ? "whatsapp"
          : href.startsWith("tel:")
            ? "phone"
            : "email";
        trackMetaEvent("Contact", { contact_method: method, content_name: href });
      }
    };
    document.addEventListener("click", onDocumentClick, { capture: true });
    return () => document.removeEventListener("click", onDocumentClick, { capture: true });
  }, []);

  return null;
}

export function MetaPixelPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}

export interface ViewContentProduct {
  id: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  categoryNameAr?: string;
  categoryNameEn?: string;
}

export function MetaPixelViewContent({ product }: { product: ViewContentProduct }) {
  const firedForId = useRef<string | null>(null);

  useEffect(() => {
    if (firedForId.current === product.id) return;
    firedForId.current = product.id;

    trackMetaEvent(
      "ViewContent",
      {
        content_name: product.nameAr,
        content_category: product.categoryNameAr || product.categoryNameEn || "Cosmetics",
        content_ids: [product.id],
        content_type: "product",
        value: Number(product.price) || 0,
        currency: "EGP",
      },
      {
        eventId: `viewcontent_${product.id}_${Date.now()}`,
      },
    );
  }, [product]);

  return null;
}

export function MetaPixelViewCollection({
  slug,
  nameEn,
  setCount,
}: {
  slug: string;
  nameEn: string;
  setCount: number;
}) {
  const firedForSlug = useRef<string | null>(null);

  useEffect(() => {
    if (firedForSlug.current === slug) return;
    firedForSlug.current = slug;

    trackMetaEvent(
      "ViewContent",
      {
        content_name: nameEn,
        content_category: "Collection",
        content_ids: [slug],
        content_type: "product_group",
        num_items: setCount,
        currency: "EGP",
      },
      {
        eventId: `viewcollection_${slug}_${Date.now()}`,
      },
    );
  }, [slug, nameEn, setCount]);

  return null;
}

export interface PurchaseOrder {
  orderNumber: string;
  total: number;
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    productId?: string;
    product_id?: string;
    nameAr?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    unitPrice?: number;
  }>;
}

export function MetaPixelPurchase({ order }: { order: PurchaseOrder }) {
  const firedForOrder = useRef<string | null>(null);

  useEffect(() => {
    if (firedForOrder.current === order.orderNumber) return;
    firedForOrder.current = order.orderNumber;

    const contentIds = (order.items || [])
      .map((item) => item.productId || item.product_id)
      .filter((id): id is string => Boolean(id));

    const contents = (order.items || []).map((item) => ({
      id: item.productId || item.product_id || item.productName || item.nameAr || "item",
      quantity: item.quantity ?? 1,
      item_price: item.unitPrice ?? item.price ?? 0,
    }));

    const numItems = (order.items || []).reduce(
      (sum, item) => sum + (item.quantity ?? 1),
      0,
    );

    const eventId = `purchase_${order.orderNumber}`;
    const win = window as { __rvPurchaseInline?: string };
    const alreadyFiredInline = win.__rvPurchaseInline === order.orderNumber;
    if (alreadyFiredInline) {
      delete win.__rvPurchaseInline;
    }

    trackMetaEvent(
      "Purchase",
      {
        content_type: "product",
        content_ids: contentIds,
        contents,
        value: Number(order.total) || 0,
        currency: "EGP",
        num_items: numItems > 0 ? numItems : 1,
        order_id: order.orderNumber,
      },
      {
        eventId,
        skipBrowser: alreadyFiredInline,
        userData: {
          phone: order.customerPhone,
          fullName: order.customerName,
        },
      },
    );
  }, [order]);

  return null;
}
