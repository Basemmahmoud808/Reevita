import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { TrackForm } from "@/components/orders/track-form";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "تتبّع الطلب — REEVITA",
  description: "تتبّعي حالة طلبك في ريفيتا باستخدام رقم الطلب ورقم الهاتف.",
  alternates: { canonical: `${siteUrl}/track` },
  robots: { index: true, follow: true },
};

type TrackPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const { order } = await searchParams;
  const initialOrder = typeof order === "string" ? order.slice(0, 32) : "";

  return (
    <div className="bg-ivory">
      <section className="border-b border-line/70 bg-cream/40 py-12 md:py-16">
        <div className="container-luxe">
          <p className="eyebrow">
            <PackageSearch className="size-3.5" aria-hidden /> ORDER TRACKING
          </p>
          <h1 className="display-xl mt-4">تتبّع طلبك</h1>
          <p className="lead mt-3 max-w-2xl">
            أدخلي رقم الطلب ورقم الموبايل الذي استخدمتِه عند الشراء لعرض حالة الشحنة. لا نكشف عن أي
            بيانات شخصية إضافية.
          </p>
        </div>
      </section>

      <section className="container-luxe py-10 md:py-14">
        <TrackForm initialOrder={initialOrder} />
      </section>
    </div>
  );
}
