import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  ClipboardList,
  PackageSearch,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { getAdminMetrics, getAdminOrders, getAuditLog } from "@/lib/data/admin";
import { formatDateTimeAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [metrics, recent, audit] = await Promise.all([
    getAdminMetrics(),
    getAdminOrders({ limit: 6 }),
    getAuditLog(8),
  ]);

  const kpis = [
    {
      icon: ClipboardList,
      label: "الطلبات النشطة",
      value: String(metrics.total_orders),
      hint: "بدون الطلبات الملغاة والمرفوضة",
    },
    {
      icon: BadgeDollarSign,
      label: "إجمالي المبيعات",
      value: formatEGP(Number(metrics.total_sales_egp)),
      hint: "طلبات نشطة (COD)",
    },
    {
      icon: TrendingUp,
      label: "متوسط قيمة الطلب",
      value: formatEGP(Number(metrics.average_order_value ?? 0)),
      hint: "لكل طلب نشط",
    },
    {
      icon: TriangleAlert,
      label: "نسبة الرفض",
      value: `${Number(metrics.refusal_rate_percentage).toFixed(1)}%`,
      hint: `${metrics.refused_count} طلب مرفوض`,
    },
  ];

  const statusEntries = Object.entries(metrics.orders_by_status ?? {}).sort(
    (a, b) => b[1] - a[1],
  );
  const maxStatus = Math.max(1, ...statusEntries.map(([, value]) => Number(value)));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">OVERVIEW</p>
        <h1 className="display-lg mt-2">لوحة التحكم</h1>
        <p className="mt-1 text-xs text-muted">نظرة سريعة على أداء متجر ريفيتا اليوم.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-line bg-white/80 p-5">
            <span className="flex size-9 items-center justify-center rounded-full bg-cream text-gold-deep">
              <kpi.icon className="size-4.5" aria-hidden />
            </span>
            <p className="mt-3 text-[0.65rem] font-semibold text-muted">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-plum">{kpi.value}</p>
            <p className="mt-0.5 text-[0.6rem] text-muted">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-white/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-md text-lg">أحدث الطلبات</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-gold-deep hover:underline">
              كل الطلبات
              <ArrowLeft className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-line text-[0.62rem] text-muted">
                  <th className="py-2 text-start font-semibold">الطلب</th>
                  <th className="py-2 text-start font-semibold">العميلة</th>
                  <th className="py-2 text-start font-semibold">الحالة</th>
                  <th className="py-2 text-start font-semibold">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {recent.orders.map((order) => (
                  <tr key={order.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5">
                      <Link href={`/admin/orders/${order.id}`} dir="ltr" className="font-semibold text-plum hover:text-gold-deep">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 text-ink">{order.customerName}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-cream px-2 py-0.5 text-[0.6rem] font-bold text-plum">
                        {statusMeta(order.status as OrderStatus).ar}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-plum">{formatEGP(order.total)}</td>
                  </tr>
                ))}
                {recent.orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted">
                      لا توجد طلبات بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white/80 p-5">
          <h2 className="display-md text-lg">توزيع الحالات</h2>
          <ul className="mt-4 space-y-3">
            {statusEntries.map(([status, value]) => (
              <li key={status}>
                <div className="flex items-center justify-between text-[0.68rem] font-semibold">
                  <span className="text-plum">{statusMeta(status).ar}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${(Number(value) / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {statusEntries.length === 0 && <li className="text-xs text-muted">لا توجد بيانات.</li>}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <h2 className="display-md text-lg">مخزون منخفض</h2>
            <Link href="/admin/products" className="text-xs font-bold text-gold-deep hover:underline">
              إدارة المخزون
            </Link>
          </div>
          {metrics.low_stock_items.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-success/5 px-3 py-3 text-xs text-success">
              <PackageSearch className="size-4" aria-hidden />
              كل المنتجات بمستويات مخزون صحية.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-xs">
              {metrics.low_stock_items.map((item) => (
                <li key={item.product_id} className="flex items-center justify-between py-2.5">
                  <span className="text-ink">{item.name_ar || item.name}</span>
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 font-bold text-danger">
                    {item.quantity_available} متبقٍ
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white/80 p-5">
          <h2 className="display-md text-lg">سجل الرقابة</h2>
          <ul className="mt-3 space-y-2.5 text-[0.68rem]">
            {audit.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-line/60 pb-2.5 last:border-0">
                <div>
                  <p className="font-bold text-plum">{entry.action}</p>
                  <p className="text-muted">
                    {entry.entity}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[0.6rem] text-muted">{formatDateTimeAr(entry.createdAt)}</span>
              </li>
            ))}
            {audit.length === 0 && <li className="text-muted">لا توجد حركات مسجلة.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
