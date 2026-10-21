import Link from "next/link";
import { Mail, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CrownIcon, FacebookIcon, InstagramIcon } from "@/components/brand/marks";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { brand, categories } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";

const storeLinks = [
  { href: "/about", label: "قصتنا" },
  { href: "/shop", label: "كل المنتجات" },
  { href: "/collections", label: "مجموعات العطور" },
  { href: "/track", label: "تتبّع الطلب" },
  { href: "/faq", label: "الأسئلة الشائعة" },
  { href: "/contact", label: "تواصلي معنا" },
];

const policyLinks = [
  { href: "/policies/shipping", label: "الشحن والتوصيل" },
  { href: "/policies/returns", label: "الاستبدال والاسترجاع" },
  { href: "/policies/privacy", label: "سياسة الخصوصية" },
  { href: "/policies/terms", label: "الشروط والأحكام" },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-plum-deep text-ivory">
      <div className="pointer-events-none absolute -top-24 start-1/4 size-[420px] rounded-full bg-wine/25 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 end-0 size-[320px] rounded-full bg-gold/10 blur-[110px]" aria-hidden />

      <div className="container-luxe relative pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr_1fr_1.2fr]">
          <div>
            <Logo variant="light" size="lg" />
            <p className="mt-5 max-w-xs text-sm leading-8 text-ivory/65">{brand.descriptionAr}</p>
            <div className="mt-6 flex items-center gap-2">
              <a
                href={brand.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                aria-label="إنستجرام ريفيتا"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href={brand.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                aria-label="فيسبوك ريفيتا"
              >
                <FacebookIcon className="size-4" />
              </a>
              <a
                href={whatsappLink(brand.whatsapp, "أهلًا ريفيتا، أحتاج مساعدة")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-ivory/15 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                aria-label="واتساب ريفيتا"
              >
                <MessageCircle className="size-4" aria-hidden />
              </a>
            </div>
          </div>

          <nav aria-label="تسوّقي">
            <h2 className="eyebrow-plain text-[0.6rem] text-gold">تسوّقي</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="text-ivory/65 transition-colors hover:text-gold"
                  >
                    {category.nameAr}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="ريفيتا">
            <h2 className="eyebrow-plain text-[0.6rem] text-gold">ريفيتا</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {storeLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ivory/65 transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow-plain text-[0.6rem] text-gold">انضمي إلى عالم ريفيتا</h2>
            <p className="mt-4 text-sm leading-7 text-ivory/60">
              عروض حصرية، نصائح عناية، وإطلاقات جديدة — مباشرة إلى بريدك.
            </p>
            <NewsletterForm tone="light" className="mt-4" />
            <ul className="mt-6 space-y-2.5 text-[0.78rem] text-ivory/70">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 text-gold" aria-hidden />
                <a href={`tel:${brand.supportPhone}`} dir="ltr" className="hover:text-gold">
                  {brand.supportPhoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 text-gold" aria-hidden />
                <a href={`mailto:${brand.email}`} className="hover:text-gold">
                  {brand.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-5 border-t border-ivory/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 text-[0.78rem] text-ivory/60">
            <Truck className="size-4 text-gold" aria-hidden />
            شحن سريع لكل محافظات مصر
          </div>
          <div className="flex items-center gap-2.5 text-[0.78rem] text-ivory/60">
            <ShieldCheck className="size-4 text-gold" aria-hidden />
            الدفع عند الاستلام — بدون أي مخاطرة
          </div>
          <div className="flex items-center gap-2.5 text-[0.78rem] text-ivory/60">
            <CrownIcon className="h-3 w-4 text-gold" />
            صُنع بعناية في مصر
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-6 text-[0.7rem] text-ivory/45 md:flex-row">
          <p>
            © {new Date().getFullYear()} REEVITA Cosmetics — جميع الحقوق محفوظة.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {policyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-gold">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
