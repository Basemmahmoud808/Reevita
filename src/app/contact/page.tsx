import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone, Truck } from "lucide-react";
import { brand } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "تواصلي معنا — REEVITA",
  description: "طرق التواصل مع خدمة عملاء ريفيتا: واتساب، هاتف، وبريد إلكتروني.",
  alternates: { canonical: `${siteUrl}/contact` },
};

const channels = [
  {
    icon: Phone,
    title: "هاتف الدعم",
    value: brand.supportPhoneDisplay,
    href: `tel:${brand.supportPhone}`,
    note: "من السبت إلى الخميس، ١٠ ص – ٧ م",
  },
  {
    icon: MessageCircle,
    title: "واتساب",
    value: "مراسلة سريعة",
    href: `https://wa.me/${brand.whatsapp}`,
    note: "أسرع طريقة لمتابعة طلب أو استفسار عن منتج",
  },
  {
    icon: Mail,
    title: "البريد الإلكتروني",
    value: brand.email,
    href: `mailto:${brand.email}`,
    note: "نرد خلال يوم عمل واحد",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">CONTACT</p>
          <h1 className="display-xl mt-4">تواصلي معنا</h1>
          <p className="lead mt-3 max-w-2xl">
            فريق ريفيتا جاهز لمساعدتك في اختيار المنتج المناسب أو متابعة شحنتك.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-5 py-10 md:grid-cols-3 md:py-14">
        {channels.map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            target={channel.href.startsWith("http") ? "_blank" : undefined}
            rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-2xl border border-line bg-white/80 p-6 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <channel.icon className="size-5 text-gold-deep" aria-hidden />
            <h2 className="display-md mt-3 text-lg">{channel.title}</h2>
            <p dir="ltr" className="mt-1 text-sm font-bold text-plum">
              {channel.value}
            </p>
            <p className="mt-2 text-[0.7rem] leading-6 text-muted">{channel.note}</p>
          </a>
        ))}
      </section>

      <section className="container-luxe pb-14">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
            <p className="text-sm leading-7 text-plum">
              التوصيل متاح لجميع محافظات مصر مع الدفع عند الاستلام. تعرّفي على المواعيد والرسوم من
              صفحة الطلب.
            </p>
          </div>
          <Link href="/shop" className="btn btn-primary">
            تسوّقي الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
