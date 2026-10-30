"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState("");
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [mobilePanelStyle, setMobilePanelStyle] = useState<CSSProperties | null>(null);
  const router = useRouter();
  const total = newOrderCount + lowStockCount;

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      setPushEnabled(Boolean(subscription));
    });
  }, []);

  async function togglePushNotifications() {
    setPushBusy(true);
    setPushMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setPushMessage("هذا المتصفح لا يدعم Web Push. جرّب متصفحًا حديثًا، أو ثبّت الموقع كتطبيق إذا كان جهازك يشترط ذلك.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setPushMessage("إعداد إشعارات الهاتف غير مكتمل بعد.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const response = await fetch("/api/admin/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        if (!response.ok) throw new Error("تعذّر إيقاف الإشعارات على هذا الجهاز.");
        await existing.unsubscribe();
        setPushEnabled(false);
        setPushMessage("تم إيقاف إشعارات هذا الجهاز.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushMessage(permission === "denied" ? "اسمحي بالإشعارات من إعدادات المتصفح لتفعيلها." : "لم يتم السماح بالإشعارات.");
        return;
      }

      const keyBytes = Uint8Array.from(window.atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });
      const response = await fetch("/api/admin/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error("تم السماح بالإشعارات، لكن تعذّر حفظ الجهاز. أعيدي المحاولة.");
      }
      setPushEnabled(true);
      setPushMessage("تم تفعيل إشعارات الطلبات الجديدة على هذا الجهاز.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "تعذّر تفعيل الإشعارات.");
    } finally {
      setPushBusy(false);
    }
  }

  async function sendTelegramTest() {
    setTelegramBusy(true);
    setTelegramMessage("");
    try {
      const response = await fetch("/api/admin/telegram-test", { method: "POST" });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "تعذّر اختبار إشعار Telegram.");
      setTelegramMessage(result.message ?? "أُرسلت رسالة الاختبار. راجع Telegram.");
    } catch (error) {
      setTelegramMessage(error instanceof Error ? error.message : "تعذّر اختبار إشعار Telegram.");
    } finally {
      setTelegramBusy(false);
    }
  }

  function getMobilePanelStyle(): CSSProperties {
    const button = notificationButtonRef.current;
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const offsetLeft = viewport?.offsetLeft ?? 0;
    const offsetTop = viewport?.offsetTop ?? 0;
    const width = Math.min(360, Math.max(0, viewportWidth - 24));
    const bounds = button?.getBoundingClientRect();
    const preferredTop = (bounds?.bottom ?? offsetTop + 12) + 8;
    const top = Math.max(offsetTop + 12, Math.min(preferredTop, offsetTop + viewportHeight - 180));

    return {
      position: "fixed",
      left: offsetLeft + Math.max(12, (viewportWidth - width) / 2),
      top,
      width,
      maxHeight: Math.max(120, offsetTop + viewportHeight - top - 12),
      overflowY: "auto",
    };
  }

  function isMobilePanel() {
    return window.matchMedia("(max-width: 640px)").matches ||
      (window.matchMedia("(pointer: coarse)").matches && window.screen.width <= 900);
  }

  function togglePanel() {
    if (open) {
      setOpen(false);
      return;
    }
    if (isMobilePanel()) {
      setMobilePanelStyle(getMobilePanelStyle());
    } else {
      setMobilePanelStyle(null);
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open || !mobilePanelStyle) return;
    const reposition = () => setMobilePanelStyle(getMobilePanelStyle());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, mobilePanelStyle]);

  return (
    <div className="relative">
      <button
        ref={notificationButtonRef}
        type="button"
        onClick={togglePanel}
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

      {open && mobilePanelStyle && typeof document !== "undefined" ? createPortal(
        <>
          <button
            type="button"
            aria-label="إغلاق الإشعارات"
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <section
            role="dialog"
            aria-label="إشعارات الإدارة"
            className="fixed z-[9999] w-[min(22.5rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-4 text-start shadow-xl"
            style={mobilePanelStyle}
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-bold text-plum">الإشعارات</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-cream">إغلاق</button>
            </div>

            <NotificationPanelContent
              total={total}
              newOrderCount={newOrderCount}
              newOrders={newOrders}
              lowStockCount={lowStockCount}
              lowStockItems={lowStockItems}
              pushBusy={pushBusy}
              pushEnabled={pushEnabled}
              pushMessage={pushMessage}
              telegramBusy={telegramBusy}
              telegramMessage={telegramMessage}
              onTogglePush={togglePushNotifications}
              onSendTelegramTest={sendTelegramTest}
              onClose={() => setOpen(false)}
            />
          </section>
        </>,
        document.body,
      ) : open && (
        <section
          role="dialog"
          aria-label="إشعارات الإدارة"
          className={`${mobilePanelStyle ? "fixed" : "absolute end-0 top-12"} z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 text-start shadow-xl`}
          style={mobilePanelStyle ?? undefined}
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-plum">الإشعارات</h2>
            <span className="text-[0.68rem] text-muted">تتحدث تلقائيًا كل دقيقة</span>
          </div>

          <NotificationPanelContent
            total={total}
            newOrderCount={newOrderCount}
            newOrders={newOrders}
            lowStockCount={lowStockCount}
            lowStockItems={lowStockItems}
            pushBusy={pushBusy}
            pushEnabled={pushEnabled}
            pushMessage={pushMessage}
            telegramBusy={telegramBusy}
            telegramMessage={telegramMessage}
            onTogglePush={togglePushNotifications}
            onSendTelegramTest={sendTelegramTest}
            onClose={() => setOpen(false)}
          />
        </section>
      )}
    </div>
  );
}

function NotificationPanelContent({
  total,
  newOrderCount,
  newOrders,
  lowStockCount,
  lowStockItems,
  pushBusy,
  pushEnabled,
  pushMessage,
  telegramBusy,
  telegramMessage,
  onTogglePush,
  onSendTelegramTest,
  onClose,
}: {
  total: number;
  newOrderCount: number;
  newOrders: AdminOrder[];
  lowStockCount: number;
  lowStockItems: LowStockItem[];
  pushBusy: boolean;
  pushEnabled: boolean;
  pushMessage: string;
  telegramBusy: boolean;
  telegramMessage: string;
  onTogglePush: () => void;
  onSendTelegramTest: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="border-b border-line py-3">
        <button
          type="button"
          disabled={pushBusy}
          onClick={onTogglePush}
          className="min-h-11 w-full rounded-xl bg-plum px-3 py-2.5 text-xs font-bold text-ivory transition-colors hover:bg-plum/90 disabled:opacity-60"
        >
          {pushBusy ? "جارٍ تحديث إعدادات الهاتف…" : pushEnabled ? "إيقاف إشعارات هذا الجهاز" : "تفعيل إشعارات الهاتف"}
        </button>
        {pushMessage && <p role="status" className="mt-2 text-[0.68rem] leading-5 text-muted">{pushMessage}</p>}
        <button
          type="button"
          disabled={telegramBusy}
          onClick={onSendTelegramTest}
          className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-plum transition-colors hover:bg-cream disabled:opacity-60"
        >
          {telegramBusy ? "جارٍ اختبار Telegram…" : "إرسال رسالة اختبار إلى Telegram"}
        </button>
        {telegramMessage && <p role="status" className="mt-2 text-[0.68rem] leading-5 text-muted">{telegramMessage}</p>}
      </div>

      {total === 0 ? (
        <p className="py-6 text-center text-xs text-muted">لا توجد إشعارات جديدة</p>
      ) : (
        <div className="space-y-4 py-3">
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
                        onClick={onClose}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs hover:bg-cream"
                      >
                        <span className="min-w-0 truncate text-ink">{order.customerName} · {order.orderNumber}</span>
                        <span className="shrink-0 text-muted">عرض الطلب</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link href="/admin/orders" onClick={onClose} className="inline-flex min-h-11 items-center text-xs text-muted hover:text-plum">
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
                    <li key={item.product_id} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs">
                      <span className="min-w-0 truncate text-ink">{item.name_ar || item.name}</span>
                      <span className="shrink-0 text-berry">متبقي {item.quantity_available}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link href="/admin/products" onClick={onClose} className="mt-1 inline-flex min-h-11 items-center px-2 text-xs font-semibold text-muted hover:text-plum">
                مراجعة المخزون
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
