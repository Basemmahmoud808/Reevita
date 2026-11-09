"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const links = [
  { href: "/shop", labelEn: "Shop all products", labelAr: "كل المنتجات" },
  { href: "/collections", labelEn: "Curated collections", labelAr: "المجموعات المميزة" },
  { href: "/faq", labelEn: "Frequently asked questions", labelAr: "الأسئلة الشائعة" },
];

const careLinks = [
  { href: "/contact", labelEn: "Contact customer care", labelAr: "تواصلي معنا" },
  { href: "/track", labelEn: "Track an order", labelAr: "تتبّع الطلب" },
  { href: "/checkout", labelEn: "Secure checkout", labelAr: "إتمام الطلب بأمان" },
];

export function Footer() {
  const { locale } = useI18n();
  return (
    <footer className="reference-footer">
      <div className="reference-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" aria-label="REEVITA home" className="reference-wordmark">REEVITA</Link>
          <p className="mt-2 text-xs text-muted">
            {locale === "en" ? "Pure Care. Lasting Beauty." : "عناية نقية · جمال يدوم"}
          </p>
          <SocialIconLinks className="mt-5" />
        </div>

        <div>
          <p className="reference-footer-title">{locale === "en" ? "Quick Links" : "روابط سريعة"}</p>
          <div className="mt-3 space-y-2 text-xs text-muted">
            {links.map((link) => (
              <Link key={link.href} className="block transition-colors hover:text-plum" href={link.href}>
                {locale === "en" ? link.labelEn : link.labelAr}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="reference-footer-title">{locale === "en" ? "Customer Care" : "خدمة العملاء"}</p>
          <div className="mt-3 space-y-2 text-xs text-muted">
            {careLinks.map((link) => (
              <Link key={link.href} className="block transition-colors hover:text-plum" href={link.href}>
                {locale === "en" ? link.labelEn : link.labelAr}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="reference-footer-title">{locale === "en" ? "Join Our Newsletter" : "انضمي لنشرتنا البريدية"}</p>
          <p className="mt-3 text-xs leading-5 text-muted">
            {locale === "en" ? "Be the first to know about new products, exclusive offers and beauty tips." : "كوني أول من يعرف المنتجات الجديدة والعروض ونصائح العناية."}
          </p>
          <NewsletterForm className="mt-3" />
        </div>
      </div>
      <div className="reference-container flex justify-between border-t border-line py-4 text-[0.65rem] text-muted">
        <span>© {new Date().getFullYear()} REEVITA. {locale === "en" ? "All rights reserved." : "جميع الحقوق محفوظة."}</span>
        <a href="https://www.facebook.com/share/1CWMusi43s/" target="_blank" rel="noreferrer" className="font-semibold transition-colors hover:text-plum">
          Powered by Basem
        </a>
      </div>
    </footer>
  );
}
