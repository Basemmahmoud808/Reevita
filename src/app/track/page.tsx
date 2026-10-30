import type { Metadata } from "next";
import { TrackForm } from "@/components/orders/track-form";

export const metadata: Metadata = {
  title: "تتبع الطلب",
  description: "تابع حالة طلب REEVITA باستخدام رقم الطلب ورقم الهاتف المسجل عند الشراء.",
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const params = await searchParams;
  const order = Array.isArray(params.order) ? params.order[0] : params.order;
  return (
    <main className="container-luxe py-10 md:py-14">
      <div className="mb-9 max-w-2xl">
        <p className="eyebrow">خدمة الطلبات</p>
        <h1 className="display-xl mt-3">تتبع طلبك</h1>
        <p className="lead mt-3">أدخل رقم الطلب ورقم الهاتف المستخدم عند الشراء لمعرفة آخر حالة للتوصيل.</p>
      </div>
      <TrackForm initialOrder={order ?? ""} />
    </main>
  );
}
