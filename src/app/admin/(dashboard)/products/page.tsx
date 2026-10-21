import { getInventory } from "@/lib/data/admin";
import { AdminInventoryRow } from "@/components/admin/admin-inventory-row";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const inventory = await getInventory();
  const lowCount = inventory.filter((item) => item.quantityAvailable <= item.lowStockThreshold).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">CATALOG</p>
        <h1 className="display-lg mt-2">المنتجات والمخزون</h1>
        <p className="mt-1 text-xs text-muted">
          {inventory.length} منتج · {lowCount} تحت حد التنبيه
        </p>
      </div>

      <p className="rounded-xl border border-line bg-white/70 px-4 py-3 text-[0.68rem] leading-6 text-muted">
        تعديل المخزون يُسجَّل تلقائيًا في سجل الرقابة (audit_log) على Supabase. لإضافة منتجات جديدة
        أو تغيير الصور، استخدمي Supabase Studio — الواجهة الحالية لإدارة المنتجات الحالية فقط.
      </p>

      <div className="space-y-3">
        {inventory.map((item) => (
          <AdminInventoryRow key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
}
