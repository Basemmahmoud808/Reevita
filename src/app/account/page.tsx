import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/auth/session";
import { signOutAction } from "@/lib/actions/auth";
import { getCustomerOrders } from "@/lib/data/orders";
import { formatDateAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";

export const metadata: Metadata = { title: "حسابي", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireCustomer();
  const orders = await getCustomerOrders(user.email, user.phone);
  return (
    <div className="container-luxe max-w-3xl py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-xl">حسابي</h1>
          <p className="mt-2 text-sm text-muted" dir="ltr">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn btn-outline">تسجيل الخروج</button>
        </form>
      </div>
      <h2 className="display-md mt-10 text-xl">طلباتي</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-muted">لا توجد طلبات بعد. <Link href="/shop" className="font-bold text-gold-deep">تسوّقي الآن</Link></p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line bg-white/80 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`} dir="ltr" className="latin font-semibold text-plum">{order.orderNumber}</Link>
                <span>{statusMeta(order.status).ar}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{formatDateAr(order.createdAt)} · {formatEGP(order.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
