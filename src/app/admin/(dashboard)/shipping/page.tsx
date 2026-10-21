import { getShippingRates } from "@/lib/data/admin";
import { AdminShippingRow } from "@/components/admin/admin-shipping-row";
import { formatEGP } from "@/lib/format";

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

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "القاهرة/الجيزة/الإسكندرية", value: "٥٠ ج.م" },
          { label: "الدلتا والقناة", value: "٦٥ ج.م" },
          { label: "الصعيد والحدود", value: "٨٠–١٠٠ ج.م" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-line bg-white/70 px-4 py-3">
            <p className="text-[0.62rem] text-muted">{item.label}</p>
            <p className="mt-0.5 text-sm font-bold text-plum">{item.value}</p>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-line bg-white/70 px-4 py-3 text-[0.68rem] leading-6 text-muted">
        الشحن مجاني تلقائيًا عند تجاوز حد الشحن المجاني المحدد لكل محافظة (الافتراضي{" "}
        {formatEGP(1000)} للقاهرة والجيزة والإسكندرية). التعديلات تُسجَّل في سجل الرقابة.
      </p>

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
