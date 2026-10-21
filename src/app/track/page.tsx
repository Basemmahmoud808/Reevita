import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/orders/track-form";

export const metadata: Metadata = {
  title: "تتبّع الطلب",
  description: "تتبّعي حالة طلبك من ريفيتا برقم الطلب ورقم الهاتف.",
  alternates: { canonical: "/track" },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const orderParam = typeof params.order === "string" ? params.order : "";

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/50 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">ORDER TRACKING</p>
          <h1 className="display-xl mt-4">تتبّعي طلبك</h1>
          <p className="lead mt-3 max-w-xl">
            اطمئني على شحنتك في أي وقت. أدخلي رقم الطلب ورقم الهاتف لعرض الحالة التفصيلية.
          </p>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        <TrackForm initialOrder={orderParam} />
      </section>

      <section className="container-luxe pb-16">
        <div className="grid gap-4 rounded-2xl border border-line bg-white/60 p-6 sm:grid-cols-3">
          {[
            { title: "لم يصلك رقم الطلب؟", text: "ابحثي في رسالة التأكيد أو تواصلي معنا على واتساب." },
            { title: "تأخرت الشحنة؟", text: "تصلي عادة خلال ١–٤ أيام عمل حسب المحافظة." },
            { title: "تحتاجين مساعدة؟", text: "فريق ريفيتا جاهز لمساعدتك يوميًا من ١٠ ص إلى ٨ م." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-bold text-plum">{item.title}</p>
              <p className="mt-1 text-[0.72rem] leading-6 text-muted">{item.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          تحتاجين مساعدة إضافية؟{" "}
          <Link href="/contact" className="font-bold text-gold-deep hover:underline">
            تواصلي معنا
          </Link>
        </p>
      </section>
    </div>
  );
}
