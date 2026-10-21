import type { Metadata } from "next";
import Link from "next/link";
import { LogOut, Package, ShoppingBag, UserRound } from "lucide-react";
import { requireCustomer } from "@/lib/auth/session";
import { getCustomerOrders } from "@/lib/data/orders";
import { signOutAction } from "@/lib/actions/auth";
import { isDemoMode } from "@/lib/env";
import { formatDateAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";

export const metadata: Metadata = {
  title: "حسابي",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await requireCustomer();
  const orders = await getCustomerOrders(user.email, user.phone);

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">MY ACCOUNT</p>
          <h1 className="display-xl mt-3">أهلًا، {user.fullName.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-outline px-4 py-2 text-xs">
              لوحة الإدارة
            </Link>
          )}
          <form action={signOutAction}>
            <button type="submit" className="btn btn-outline px-4 py-2 text-xs">
              <LogOut className="size-3.5" aria-hidden />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>

      {isDemoMode && (
        <p className="mt-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[0.75rem] leading-6 text-plum">
          أنت في وضع العرض التجريبي. جرّبي تسجيل الدخول ببريد <span dir="ltr">mona@example.com</span>{" "}
          لعرض طلبات تجريبية سابقة، أو أكملي طلبًا جديدًا ليظهر هنا.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {[
          { icon: UserRound, label: "الاسم", value: user.fullName },
          { icon: ShoppingBag, label: "طلباتك", value: `${orders.length} طلب` },
          { icon: Package, label: "طريقة الدفع", value: "عند الاستلام" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-line bg-white/70 p-5">
            <card.icon className="size-5 text-gold-deep" aria-hidden />
            <p className="mt-3 text-[0.65rem] text-muted">{card.label}</p>
            <p className="mt-1 text-sm font-bold text-plum">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="display-lg text-2xl">طلباتي</h2>
          <Link href="/shop" className="text-xs font-bold text-gold-deep hover:underline">
            تسوّقي المزيد
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line bg-white/40 px-6 py-14 text-center">
            <ShoppingBag className="mx-auto size-8 text-gold/70" aria-hidden />
            <p className="mt-3 text-sm font-bold text-plum">لا توجد طلبات بعد</p>
            <p className="mt-1 text-xs text-muted">طلباتك القادمة ستظهر هنا مع حالة الشحن.</p>
            <Link href="/shop" className="btn btn-primary mt-5">
              ابدئي التسوق
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => {
              const meta = statusMeta(order.status);
              return (
                <li key={order.id} className="rounded-2xl border border-line bg-white/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p dir="ltr" className="latin text-lg font-semibold text-plum">
                        {order.orderNumber}
                      </p>
                      <p className="text-[0.68rem] text-muted">{formatDateAr(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-cream px-3 py-1 text-[0.65rem] font-bold text-plum">
                        {meta.ar}
                      </span>
                      <span className="text-sm font-bold text-plum">{formatEGP(order.total)}</span>
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 text-[0.7rem] text-muted">
                    {order.items.map((item, index) => (
                      <li key={`${order.id}-${index}`} className="rounded-full bg-cream/60 px-2.5 py-1">
                        {item.productName} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/track?order=${encodeURIComponent(order.orderNumber)}`}
                    className="mt-3 inline-block text-xs font-bold text-gold-deep hover:underline"
                  >
                    تتبّع الطلب ←
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
