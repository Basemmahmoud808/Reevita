import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { brand } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Contact REEVITA customer care.",
};

export default function ContactPage() {
  return (
    <main className="container-luxe max-w-4xl py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">CUSTOMER CARE</p>
        <h1 className="display-xl mt-3">We are here to help</h1>
        <p className="lead mt-3">Questions about a product, delivery or your ritual? Reach out and our team will get back to you.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <a href={`tel:${brand.supportPhone}`} className="card-luxe p-6 transition-transform hover:-translate-y-1"><Phone className="size-6 text-gold-deep" aria-hidden /><h2 className="mt-5 font-bold text-plum">Call us</h2><p className="mt-2 text-sm text-muted">{brand.supportPhoneDisplay}</p></a>
        <a href={`mailto:${brand.email}`} className="card-luxe p-6 transition-transform hover:-translate-y-1"><Mail className="size-6 text-gold-deep" aria-hidden /><h2 className="mt-5 font-bold text-plum">Email us</h2><p className="mt-2 break-words text-sm text-muted">{brand.email}</p></a>
        <a href={`https://wa.me/${brand.whatsapp}`} className="card-luxe p-6 transition-transform hover:-translate-y-1"><MessageCircle className="size-6 text-gold-deep" aria-hidden /><h2 className="mt-5 font-bold text-plum">WhatsApp</h2><p className="mt-2 text-sm text-muted">Chat with customer care</p></a>
      </div>
      <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-6 text-sm leading-7 text-plum">For order updates, use the <Link href="/track" className="font-bold underline">order tracking page</Link> for the fastest answer.</div>
    </main>
  );
}
