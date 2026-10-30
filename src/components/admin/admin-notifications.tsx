"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Package, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminOrder } from "@/lib/data/admin";

type LowStockItem = {
  product_id: string;
  name: string;
  name_ar: string;
  quantity_available: number;
};

type Props = {
  newOrderCount: number;
  newOrders: AdminOrder[];
  lowStockCount: number;
  lowStockItems: LowStockItem[];
};

export function AdminNotifications({ newOrderCount, newOrders, lowStockCount, lowStockItems }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const total = newOrderCount + lowStockCount;

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={total ? `الإشعارات، ${total} تنبيه` : "الإشعارات"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex size-10 items-center justify-center rounded-full border border-line bg-white/80 text-plum transition-colors hover:bg-cream"
      >
        <Bell className="size-4" aria-hidden />
        {total > 0 && (
          <span className="absolute -end-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[0.6rem] font-bold text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="إشعارات الإدارة"
          className="absolute end-0 top-12 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 text-start shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-plum">الإشعارات</h2>
            <span className="text-[0.68rem] text-muted">تتحدث تلقائيًا كل دقيقة</span>
          </div>

          {total === 0 ? (
            <p className="py-6 text-center text-xs text-muted">لا توجد إشعارات جديدة</p>
          ) : (
            <div className="max-h-80 space-y-4 overflow-y-auto py-3">
              {newOrderCount > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-plum">
                    <ShoppingCart className="size-4 text-gold-deep" aria-hidden />
                    طلبات جديدة ({newOrderCount})
                  </div>
                  {newOrders.length ? (
                    <ul className="space-y-1">
                      {newOrders.map((order) => (
                        <li key={order.id}>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs hover:bg-cream"
                          >
                            <span className="min-w-0 truncate text-ink">{order.customerName} · {order.orderNumber}</span>
                            <span className="shrink-0 text-muted">عرض الطلب</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Link href="/admin/orders" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-plum">
                      عرض الطلبات الجديدة
                    </Link>
                  )}
                </div>
              )}

              {lowStockCount > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-plum">
                    <Package className="size-4 text-gold-deep" aria-hidden />
                    مخزون منخفض ({lowStockCount})
                  </div>
                  {lowStockItems.length ? (
                    <ul className="space-y-1">
                      {lowStockItems.slice(0, 5).map((item) => (
                        <li key={item.product_id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs">
                          <span className="min-w-0 truncate text-ink">{item.name_ar || item.name}</span>
                          <span className="shrink-0 text-berry">متبقي {item.quantity_available}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link href="/admin/products" onClick={() => setOpen(false)} className="mt-1 inline-block px-2 text-xs font-semibold text-muted hover:text-plum">
                    مراجعة المخزون
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
