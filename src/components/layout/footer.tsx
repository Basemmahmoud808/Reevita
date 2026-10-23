"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SocialIconLinks } from "@/components/ui/social-icon";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/checkout", label: "Checkout" },
];

const careLinks = [
  { href: "/track", label: "Track your order" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/policies/privacy", label: "Privacy" },
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
          <div className="mt-3 flex border-b border-[#cfc8bb] pb-2">
            <span className="flex-1 text-xs text-[#aaa69c]">Your email address</span>
            <Check className="size-4 text-[#405247]" />
          </div>
        </div>
      </div>
      <div className="reference-container flex justify-between border-t border-[#ded8cc] py-4 text-[0.6rem] text-[#99958a]">
        <span>© {new Date().getFullYear()} REEVITA. All rights reserved.</span>
        <span>Skincare / Haircare / Beauty</span>
      </div>
    </footer>
  );
}
