import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Check, CircleHelp, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { LAST_ORDER_COOKIE } from "@/lib/orders/constants";
import { getPlacedDemoOrder } from "@/lib/data/orders";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { brand } from "@/lib/catalog";
import { formatDateTimeAr, formatEGP } from "@/lib/format";
import { statusMeta } from "@/lib/orders/status";
import type { PlacedOrder } from "@/lib/types";

export const metadata: Metadata = {
  title: "تم استلام طلبك",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ orderNumber: string }>;
}

async function readOrder(orderNumber: string): Promise<PlacedOrder | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LAST_ORDER_COOKIE)?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as PlacedOrder;
      if (parsed.orderNumber?.toLowerCase() === orderNumber.toLowerCase()) return parsed;
    } catch {
      // fall through to demo lookup
    }
  }
  return getPlacedDemoOrder(orderNumber);
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = await readOrder(orderNumber);

  if (!order) {
    return (
      <div className="container-luxe flex flex-col items-center py-24 text-center">
        <CircleHelp className="size-12 text-gold-deep" aria-hidden />
        <h1 className="display-xl mt-5">الطلب غير متاح للعرض</h1>
        <p className="lead mt-3 max-w-md">
          قد يكون الرابط قديمًا أو انتهت صلاحية العرض. يمكنك تتبّع طلبك برقم الطلب ورقم الهاتف.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/track" className="btn btn-primary">
            تتبّع الطلب
          </Link>
          <Link href="/shop" className="btn btn-outline">
            متابعة التسوق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory">
      <ClearCartOnMount />
      <section className="border-b border-line/70 bg-cream/50 py-12 md:py-16">
        <div className="container-luxe max-w-3xl text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
            <Check className="size-8 text-success" aria-hidden />
          </span>
          <p className="eyebrow mt-6 justify-center">ORDER CONFIRMED</p>
          <h1 className="display-xl mt-4">تم استلام طلبك بنجاح</h1>
          <p className="lead mt-3">
            شكرًا {order.customerName}! سنتواصل معك على {order.customerPhone} لتأكيد الطلب قبل الشحن.
          </p>
          <div className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-2xl border border-gold/40 bg-ivory px-8 py-4">
            <span className="text-[0.65rem] font-bold tracking-[0.2em] text-gold-deep uppercase">
              رقم الطلب
            </span>
            <span dir="ltr" className="latin text-2xl font-semibold text-plum">
              {order.orderNumber}
            </span>
            <span className="text-[0.68rem] text-muted">{formatDateTimeAr(order.createdAt)}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-plum px-3 py-1 text-[0.68rem] font-bold text-ivory">
              {statusMeta(order.status).ar}
            </span>
            <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.68rem] font-bold text-gold-deep">
              الدفع عند الاستلام
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[0.68rem] font-bold text-plum">
              {order.governorateAr ?? ""}
            </span>
          </div>
        </div>
      </section>

      <section className="container-luxe grid gap-6 py-10 md:grid-cols-[1.4fr_1fr] md:py-14">
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-white/70 p-6">
            <h2 className="display-md text-lg">تفاصيل الطلب</h2>
            <ul className="mt-4 divide-y divide-line">
              {(order.items ?? []).map((item, index) => (
                <li key={`${item.productName}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-ink">
                    {item.productName}
                    <span className="text-muted"> × {item.quantity}</span>
                  </span>
                  <span className="font-bold text-plum">{formatEGP(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">الإجمالي الفرعي</dt>
                <dd className="font-semibold text-plum">{formatEGP(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">الشحن</dt>
                <dd className="font-semibold text-plum">
                  {order.shippingFee === 0 ? "مجاني" : formatEGP(order.shippingFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold text-plum">المبلغ المستحق عند الاستلام</dt>
                <dd className="font-bold text-plum">{formatEGP(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Truck,
                title: "التوصيل خلال ١–٤ أيام عمل",
                text: "سنتواصل معك لتأكيد موعد التسليم المناسب.",
              },
              {
                icon: PackageCheck,
                title: "افتحي الشحنة قبل الدفع",
                text: "تأكدي من منتجاتك ثم ادفعي للمندوب.",
              },
            ].map((step) => (
              <div key={step.title} className="flex gap-3 rounded-2xl border border-line bg-white/60 p-4">
                <step.icon className="size-5 shrink-0 text-gold-deep" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-plum">{step.title}</p>
                  <p className="mt-1 text-[0.72rem] leading-6 text-muted">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white/80 p-6">
            <h2 className="display-md text-lg">ماذا بعد؟</h2>
            <ol className="mt-4 space-y-4">
              {[
                "سنتصل بك لتأكيد الطلب والكمية.",
                "نجهّز الشحنة ونرسلها مع شركة الشحن.",
                "يتم التواصل معك قبل التسليم، وتدفعين عند الاستلام.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-[0.8rem] leading-7 text-muted">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cream text-[0.65rem] font-bold text-plum">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href={`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(`أهلًا ريفيتا، بخصوص طلبي ${order.orderNumber}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-5 w-full"
            >
              <MessageCircle className="size-4" aria-hidden />
              استفسار على واتساب
            </a>
            <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`} className="btn btn-primary mt-2.5 w-full">
              تتبّع حالة الطلب
            </Link>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-[0.72rem] leading-7 text-plum">
            احتفظي برقم الطلب <strong dir="ltr">{order.orderNumber}</strong> — ستحتاجينه مع رقم الهاتف
            لتتبّع الشحنة في أي وقت.
          </div>
          <Link href="/shop" className="block text-center text-sm font-bold text-plum hover:text-gold-deep">
            متابعة التسوق ←
          </Link>
        </aside>
      </section>
    </div>
  );
}
