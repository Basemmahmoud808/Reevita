import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/brand/marks";
import { brand } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "تواصلي معنا",
  description: "تواصلي مع فريق ريفيتا عبر واتساب أو الهاتف أو البريد الإلكتروني.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/50 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">CONTACT</p>
          <h1 className="display-xl mt-4">نحن هنا من أجلك</h1>
          <p className="lead mt-3 max-w-2xl">
            سؤال عن منتج، طلب، أو شراكة؟ اختاري طريقة التواصل الأنسب لك وسنرد سريعًا.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-5 py-10 md:grid-cols-2 md:py-14">
        <a
          href={whatsappLink(brand.whatsapp, "أهلًا ريفيتا، أحتاج مساعدة")}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-plum">واتساب — الأسرع</p>
            <p className="mt-1 text-[0.78rem] leading-7 text-muted">
              استفسارات الطلبات والمنتجات، ومتابعة حالة الشحن.
            </p>
            <p dir="ltr" className="mt-2 text-xs font-bold text-gold-deep">
              {brand.supportPhoneDisplay}
            </p>
          </div>
        </a>

        <a
          href={`tel:${brand.supportPhone}`}
          className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
            <Phone className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-plum">اتصال هاتفي</p>
            <p className="mt-1 text-[0.78rem] leading-7 text-muted">من ١٠ صباحًا حتى ٨ مساءً.</p>
            <p dir="ltr" className="mt-2 text-xs font-bold text-gold-deep">
              {brand.supportPhoneDisplay}
            </p>
          </div>
        </a>

        <a
          href={`mailto:${brand.email}`}
          className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
            <Mail className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-plum">البريد الإلكتروني</p>
            <p className="mt-1 text-[0.78rem] leading-7 text-muted">للشكاوى والاقتراحات والشراكات.</p>
            <p className="mt-2 text-xs font-bold text-gold-deep">{brand.email}</p>
          </div>
        </a>

        <a
          href={brand.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
            <InstagramIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-plum">إنستجرام</p>
            <p className="mt-1 text-[0.78rem] leading-7 text-muted">جديدنا، نصائح العناية، وآراء العميلات.</p>
            <p className="mt-2 text-xs font-bold text-gold-deep">@reevita.eg</p>
          </div>
        </a>
      </section>

      <section className="container-luxe pb-14">
        <div className="grid gap-4 rounded-2xl border border-line bg-cream/40 p-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-4 text-gold-deep" aria-hidden />
            <div>
              <p className="text-xs font-bold text-plum">ساعات العمل</p>
              <p className="text-[0.7rem] text-muted">يوميًا ١٠ ص — ٨ م</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 text-gold-deep" aria-hidden />
            <div>
              <p className="text-xs font-bold text-plum">الموقع</p>
              <p className="text-[0.7rem] text-muted">{brand.addressAr}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 size-4 text-gold-deep" aria-hidden />
            <div>
              <p className="text-xs font-bold text-plum">متوسط الرد</p>
              <p className="text-[0.7rem] text-muted">خلال ٣٠ دقيقة في ساعات العمل</p>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          للاستفسار عن طلب محدد، استخدمي صفحة{" "}
          <Link href="/track" className="font-bold text-gold-deep hover:underline">
            تتبّع الطلب
          </Link>{" "}
          أولًا.
        </p>
      </section>
    </div>
  );
}
