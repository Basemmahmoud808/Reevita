import type { Metadata } from "next";
import { Accordion } from "@/components/ui/accordion";
import { faqs } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "REEVITA Delivery, Payment & Product FAQs",
  description: "Find answers to common REEVITA questions about body and hair care products, cash on delivery, shipping and order support in Egypt.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <main className="container-luxe max-w-4xl py-10 md:py-14">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">CUSTOMER CARE</p>
        <h1 className="display-xl mt-3">Frequently asked questions</h1>
        <p className="lead mt-3">Everything you need to know before and after your order.</p>
      </div>
      <Accordion items={faqs.map((faq) => ({ title: faq.question, content: <p>{faq.answer}</p> }))} />
    </main>
  );
}
