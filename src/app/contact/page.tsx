import type { Metadata } from "next";
import { brand } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = { title: "تواصل معنا" };

export default function ContactPage() {
  return (
    <div className="container-luxe max-w-2xl py-10 md:py-14">
      <h1 className="display-xl mb-6">تواصل معنا</h1>
      <ul className="space-y-3 text-sm">
        <li>الهاتف: <a dir="ltr" className="font-bold text-gold-deep" href={`tel:${brand.supportPhone}`}>{brand.supportPhoneDisplay}</a></li>
        <li>واتساب: <a className="font-bold text-gold-deep" href={whatsappLink(brand.whatsapp)} rel="noopener noreferrer" target="_blank">راسلينا</a></li>
        <li>البريد: <a dir="ltr" className="font-bold text-gold-deep" href={`mailto:${brand.email}`}>{brand.email}</a></li>
      </ul>
    </div>
  );
}
