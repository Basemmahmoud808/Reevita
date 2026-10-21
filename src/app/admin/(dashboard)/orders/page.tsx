import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminOrders } from "@/lib/data/admin";
import { formatDateAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const statusFilters: Array<{ value: string; label: string }> = [
  { value: "", label: "الكل" },
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "packed", label: "تم التجهيز" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
  { value: "refused", label: "مرفوض" },
];

function buildHref(params: Record<string, string | string[] | undefined>, status: string, page?: number) {
  const query = new URLSearchParams();
  const search = typeof params.search === "string" ? params.search : "";
  if (search) query.set("search", search);
  if (status) query.set("status", status);
  if (page && page > 1) query.set("page", String(page));
  const value = query.toString();
  return value ? `/admin/orders?${value}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const search = typeof params.search === "string" ? params.search : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const limit = 20;

  const { orders, total } = await getAdminOrders({
    status: status || null,
    search: search || null,
    limit,
    offset: (page - 1) * limit,
  });
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">ORDERS</p>
          <h1 className="display-lg mt-2">إدارة الطلبات</h1>
          <p className="mt-1 text-xs text-muted">{total} طلب مطابق</p>
        </div>
        <form action="/admin/orders" method="get" role="search" className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2">
          <Search className="size-4 text-gold-deep" aria-hidden />
          <label htmlFor="orders-search" className="sr-only">
           بحث في الطلبات
          </label>
          <input
            id="orders-search"
            name="search"
            defaultValue={search}
            placeholder="رقم الطلب / الاسم / الهاتف"
            className="w-52 bg-transparent text-xs outline-none"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className="text-[0.68rem] font-bold text-plum hover:text-gold-deep">
            بحث
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={buildHref(params, filter.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[0.68rem] font-bold transition-colors",
              status === filter.value
                ? "border-plum bg-plum text-ivory"
                : "border-line bg-white/70 text-plum hover:border-gold",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white/80">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-line bg-cream/40 text-[0.62rem] text-muted">
                <th className="px-4 py-3 text-start font-semibold">الطلب</th>
                <th className="px-4 py-3 text-start font-semibold">العميلة</th>
                <th className="px-4 py-3 text-start font-semibold">المحافظة</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">الإجمالي</th>
                <th className="px-4 py-3 text-start font-semibold" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-cream/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} dir="ltr" className="font-bold text-plum hover:text-gold-deep">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{order.customerName}</p>
                    <p dir="ltr" className="text-[0.62rem] text-muted">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{order.governorateAr}</td>
                  <td className="px-4 py-3 text-[0.62rem] text-muted">{formatDateAr(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-[0.6rem] font-bold text-plum">
                      {statusMeta(order.status as OrderStatus).ar}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-plum">{formatEGP(order.total)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-[0.65rem] font-bold text-gold-deep hover:underline">
                      تفاصيل
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    لا توجد طلبات مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <Link
                key={pageNumber}
                href={buildHref(params, status, pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  pageNumber === page ? "bg-plum text-ivory" : "bg-white text-plum hover:bg-cream",
                )}
              >
                {pageNumber}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
