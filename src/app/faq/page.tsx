import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { faqs, brand } from "@/lib/catalog";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd } from "@/components/ui/json-ld";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description: "كل ما تحتاجين معرفته عن الطلب، الشحن، الدفع عند الاستلام، والاسترجاع في ريفيتا.",
  alternates: { canonical: "/faq" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function FaqPage() {
  return (
    <div className="bg-ivory">
      <JsonLd data={jsonLd} />
      <section className="border-b border-line/70 bg-cream/50 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">HELP CENTER</p>
          <h1 className="display-xl mt-4">الأسئلة الشائعة</h1>
          <p className="lead mt-3 max-w-2xl">
            جمعنا أكثر ما تسألين عنه. لو لم تجدي إجابتك، فريق ريفيتا جاهز لمساعدتك.
          </p>
        </div>
      </section>

      <section className="container-luxe grid gap-10 py-10 md:grid-cols-[1.6fr_1fr] md:py-14">
        <div>
          <Accordion
            items={faqs.map((faq) => ({ title: faq.question, content: <p className="leading-8">{faq.answer}</p> }))}
          />
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-white/70 p-6">
            <h2 className="display-md text-lg">تحتاجين مساعدة أكثر؟</h2>
            <p className="mt-2 text-[0.8rem] leading-7 text-muted">
              فريقنا يرد على واتساب من ١٠ صباحًا حتى ٨ مساءً، طوال أيام الأسبوع.
            </p>
            <a
              href={whatsappLink(brand.whatsapp, "أهلًا ريفيتا، لدي استفسار")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-4 w-full"
            >
              <MessageCircle className="size-4" aria-hidden />
              تواصلي على واتساب
            </a>
            <Link href="/contact" className="btn btn-outline mt-2 w-full">
              صفحة التواصل
            </Link>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-[0.72rem] leading-7 text-plum">
            <p className="font-bold">نصيحة سريعة</p>
            <p className="mt-1">
              للاستفسار عن طلب محدد، جهّزي رقم الطلب ورقم الهاتف — أسرع بكثير من البحث بالاسم.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
