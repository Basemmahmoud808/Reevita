import type { Metadata } from "next";
import { faqs } from "@/lib/catalog";

export const metadata: Metadata = { title: "الأسئلة الشائعة", description: "إجابات عن الطلب والشحن والدفع عند الاستلام." };

export default function FaqPage() {
  return (
    <div className="container-luxe max-w-3xl py-10 md:py-14">
      <h1 className="display-xl mb-8">الأسئلة الشائعة</h1>
      <div className="divide-y divide-line border-y border-line">
        {faqs.map((faq) => (
          <details key={faq.question} className="py-4">
            <summary className="cursor-pointer font-bold text-plum">{faq.question}</summary>
            <p className="mt-2 text-sm leading-7 text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
