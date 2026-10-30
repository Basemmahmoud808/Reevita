import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, MessageCircle, Phone, User } from "lucide-react";
import { getAdminOrder } from "@/lib/data/admin";
import { AdminStatusForm } from "@/components/admin/admin-status-form";
import { formatDateAr, formatEGP, whatsappLink } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";
import { normalizeEgyptianPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const meta = statusMeta(order.status);
  const whatsappPhone = normalizeEgyptianPhone(order.customerPhone);
  const confirmationMessage = `أهلًا ${order.customerName}، نؤكد استلام طلبك رقم ${order.orderNumber} بإجمالي ${formatEGP(order.total)}. مدة التوصيل المتوقعة من يومين إلى 3 أيام عمل. هل تؤكد الطلب؟`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-muted hover:text-plum">
            <ArrowRight className="size-3.5" aria-hidden />
            كل الطلبات
          </Link>
          <h1 dir="ltr" className="latin mt-2 text-3xl font-semibold text-plum">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-xs text-muted">{formatDateAr(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cream px-3 py-1.5 text-[0.68rem] font-bold text-plum">{meta.ar}</span>
          <span className="rounded-full bg-gold/15 px-3 py-1.5 text-[0.68rem] font-bold text-gold-deep">
            {formatEGP(order.total)}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white/80 p-5">
            <h2 className="display-md text-lg">المنتجات</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item, index) => (
                <li key={`${item.productName}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                  <div>
                    <p className="font-bold text-plum">{item.productName}</p>
                    <p className="text-[0.62rem] text-muted">
                      {formatEGP(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-plum">{formatEGP(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted">الإجمالي الفرعي</dt>
                <dd className="font-semibold text-plum">{formatEGP(order.subtotal)}</dd>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>خصم المجموعات</dt>
                  <dd className="font-bold">−{formatEGP(order.discountAmount ?? 0)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">الشحن</dt>
                <dd className="font-semibold text-plum">
                  {order.shippingFee === 0 ? "مجاني" : formatEGP(order.shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm">
                <dt className="font-bold text-plum">الإجمالي (COD)</dt>
                <dd className="font-bold text-plum">{formatEGP(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white/80 p-5">
            <h2 className="display-md text-lg">بيانات العميلة والتوصيل</h2>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <p className="flex items-center gap-2 text-ink">
                <User className="size-4 text-gold-deep" aria-hidden />
                {order.customerName}
              </p>
              <p className="flex items-center gap-2 text-ink" dir="ltr">
                <Phone className="size-4 text-gold-deep" aria-hidden />
                {order.customerPhone}
              </p>
              <p className="flex items-start gap-2 text-ink sm:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden />
                <span>
                  {order.governorateAr} — {order.city}
                  <br />
                  {order.addressLine}
                </span>
              </p>
              {order.customerEmail && (
                <p className="text-muted sm:col-span-2" dir="ltr">
                  {order.customerEmail}
                </p>
              )}
              <p className="text-muted sm:col-span-2">
                شركة الشحن: {order.shippingCarrier ?? "—"} · رقم البوليصة:{" "}
                <span dir="ltr">{order.trackingNumber ?? "—"}</span>
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          {order.status === "new" && (
            <section className="rounded-2xl border border-line bg-white/80 p-5">
              <h2 className="display-md text-lg">تأكيد الطلب</h2>
              {whatsappPhone ? (
                <>
                  <p className="mb-3 mt-1 text-[0.68rem] leading-6 text-muted">
                    افتحي رسالة التأكيد على واتساب لمراجعتها وإرسالها للعميل.
                  </p>
                  <a
                    href={whatsappLink(whatsappPhone, confirmationMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full justify-center"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    تأكيد الطلب عبر واتساب
                  </a>
                </>
              ) : (
                <p className="mt-2 text-xs leading-6 text-berry">
                  لا يمكن تجهيز رسالة واتساب لأن رقم العميل غير صالح.
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-line bg-white/80 p-5">
            <h2 className="display-md text-lg">تحديث الحالة</h2>
            <p className="mb-4 mt-1 text-[0.65rem] leading-5 text-muted">
              الحالة الحالية: <strong className="text-plum">{meta.ar}</strong>
            </p>
            <AdminStatusForm
              orderId={order.id}
              currentStatus={order.status}
              carrier={order.shippingCarrier}
              trackingNumber={order.trackingNumber}
            />
          </section>

          <section className="rounded-2xl border border-line bg-cream/50 p-5 text-[0.68rem] leading-6 text-muted">
            <p className="font-bold text-plum">إرشادات سريعة</p>
            <ul className="mt-2 list-disc space-y-1 ps-4">
              <li>أكدي الطلب هاتفيًا قبل تجهيزه لتقليل نسبة الرفض.</li>
              <li>أضيفي رقم البوليصة عند تحويل الطلب إلى «تم الشحن».</li>
              <li>عند الرفض أو الإلغاء يعود المخزون تلقائيًا للرصيد المتاح.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
