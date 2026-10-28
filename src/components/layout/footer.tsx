"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { SocialIconLinks } from "@/components/ui/social-icon";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const links = [
  { href: "/", label: "Home" },
  { href: "/checkout", label: "Checkout" },
];

const careLinks = [
  { href: "/checkout", label: "Complete your order" },
];

export function Footer() {
  const { locale } = useI18n();
  return (
    <footer className="reference-footer">
      <div className="reference-container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
        <div>
          <Link href="/" className="reference-wordmark">REEVITA</Link>
          <p className="mt-2 text-xs text-[#77766e]">Pure Care. Lasting Beauty.</p>
          <SocialIconLinks className="mt-5" />
        </div>

        <div>
          <p className="reference-footer-title">Quick Links</p>
          <div className="mt-3 space-y-2 text-xs text-[#77766e]">
            {links.map((link) => <Link key={link.href} className="block hover:text-[#34483d]" href={link.href}>{link.label}</Link>)}
          </div>
        </div>

        <div>
          <p className="reference-footer-title">Customer Care</p>
          <div className="mt-3 space-y-2 text-xs text-[#77766e]">
            {careLinks.map((link) => <Link key={link.href} className="block hover:text-[#34483d]" href={link.href}>{link.label}</Link>)}
          </div>
        </div>

        <div>
          <p className="reference-footer-title">Join Our Newsletter</p>
          <p className="mt-3 text-xs leading-5 text-[#77766e]">
            {locale === "en" ? "Be the first to know about new products, exclusive offers and beauty tips." : "كوني أول من يعرف المنتجات الجديدة والعروض ونصائح العناية."}
          </p>
          <NewsletterForm className="mt-3" />
        </div>
      </div>
      <div className="reference-container flex justify-between border-t border-[#ded8cc] py-4 text-[0.6rem] text-[#99958a]">
        <span>© {new Date().getFullYear()} REEVITA. All rights reserved.</span>
        <a href="https://www.facebook.com/share/1CWMusi43s/" target="_blank" rel="noreferrer" className="transition-colors hover:text-[#34483d]">
          Powered by Basem
        </a>
      </div>
    </footer>
  );
}
