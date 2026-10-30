import { getShippingRates } from "@/lib/data/admin";
import { AdminShippingRow } from "@/components/admin/admin-shipping-row";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const rates = await getShippingRates();

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">LOGISTICS</p>
        <h1 className="display-lg mt-2">الشحن والمحافظات</h1>
        <p className="mt-1 text-xs text-muted">27 محافظة — عدّلي الرسوم وحد الشحن المجاني لكل محافظة.</p>
      </div>

      <div className="space-y-2.5">
        {rates.map((governorate) => (
          <AdminShippingRow key={governorate.id} governorate={governorate} />
        ))}
        {rates.length === 0 && (
          <p className="rounded-xl border border-line bg-white/70 px-4 py-8 text-center text-xs text-muted">
            تعذّر تحميل بيانات المحافظات.
          </p>
        )}
      </div>
    </div>
  );
}
