import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageSearch, UserRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/actions/auth";
import { getCustomerOrders } from "@/lib/data/orders";
import { formatDateAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";

export const metadata: Metadata = {
  title: "حسابي — REEVITA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/account/login");

  // RLS limits the query to the signed-in customer's own orders.
  const orders = await getCustomerOrders(user.email, user.phone);

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-10 md:py-14">
        <div className="container-luxe flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              <UserRound className="size-3.5" aria-hidden /> MY ACCOUNT
            </p>
            <h1 className="display-xl mt-3">أهلًا {user.fullName}</h1>
            <p className="mt-2 text-sm text-muted" dir="ltr">
              {user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-outline">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        <h2 className="display-md text-xl">طلباتي</h2>
        <p className="mt-1 text-xs text-muted">
          نعرض لك فقط الطلبات المرتبطة بحسابك. للطلبات كضيفة استخدمي صفحة تتبّع الطلب.
        </p>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/50 px-6 py-14 text-center">
            <PackageSearch className="mx-auto size-10 text-gold/70" aria-hidden />
            <p className="display-md mt-4 text-lg">لا توجد طلبات على هذا الحساب بعد</p>
            <p className="mt-2 text-sm text-muted">
              إذا أتممتِ الشراء كضيفة، يمكنك تتبّع الطلب برقم الطلب ورقم الهاتف.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn btn-primary">
                تسوّقي الآن
              </Link>
              <Link href="/track" className="btn btn-outline">
                تتبّع طلب كضيفة
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {orders.map((order) => {
              const meta = statusMeta(order.status);
              return (
                <li key={order.id} className="rounded-2xl border border-line bg-white/80 p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p dir="ltr" className="latin text-sm font-bold text-plum">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-[0.68rem] text-muted">{formatDateAr(order.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-cream px-3 py-1 text-[0.68rem] font-bold text-plum">
                      {meta.ar}
                    </span>
                    <span className="text-sm font-bold text-plum">{formatEGP(order.total)}</span>
                  </div>
                  <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-muted">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-${index}`} className="flex justify-between gap-3">
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span>{formatEGP(item.totalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`} className="mt-4 inline-block text-xs font-bold text-gold-deep hover:underline">
                    تتبّع هذا الطلب ←
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
