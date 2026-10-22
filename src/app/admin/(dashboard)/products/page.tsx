import { getInventory } from "@/lib/data/admin";
import { AdminInventoryRow } from "@/components/admin/admin-inventory-row";
import { AdminProductForm } from "@/components/admin/admin-product-form";

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

      <AdminProductForm />

      <div className="space-y-3">
        {inventory.map((item) => (
          <AdminInventoryRow key={item.productId} item={item} />
        ))}
      </div>
    </div>
  );
}
