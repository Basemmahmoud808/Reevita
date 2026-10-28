import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { brand, faqs } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة — REEVITA",
  description: "أسئلة العملاء الشائعة عن الشحن، الدفع عند الاستلام، والاسترجاع في ريفيتا.",
  alternates: { canonical: `${siteUrl}/faq` },
};

export default function FaqPage() {
  const items: AccordionItem[] = faqs.map((faq) => ({
    title: faq.question,
    content: faq.answer,
  }));

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">
            <HelpCircle className="size-3.5" aria-hidden /> FAQ
          </p>
          <h1 className="display-xl mt-4">الأسئلة الشائعة</h1>
          <p className="lead mt-3 max-w-2xl">
            كل ما تحتاجين معرفته عن الشحن داخل مصر، الدفع عند الاستلام، ومدة التوصيل.
          </p>
        </div>
      </section>

      <section className="container-luxe max-w-3xl py-10 md:py-14">
        <Accordion items={items} />
        <p className="mt-8 text-sm text-muted">
          لم تجدي إجابتك؟{" "}
          <Link href="/contact" className="font-bold text-gold-deep hover:underline">
            تواصلي معنا
          </Link>{" "}
          على {brand.supportPhoneDisplay}.
        </p>
      </section>
    </div>
  );
}
