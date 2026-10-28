import { AdminCollectionManager } from "@/components/admin/admin-collection-manager";
import { getProducts } from "@/lib/data/catalog";
import { getAdminCollections } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const [collections, products] = await Promise.all([getAdminCollections(), getProducts()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">MERCHANDISING</p>
        <h1 className="display-lg mt-2">Collections</h1>
        <p className="mt-1 max-w-2xl text-xs leading-6 text-muted">
          Create visual collections, choose their cover, assign products, and control what appears in the storefront.
        </p>
      </div>
      <AdminCollectionManager collections={collections} products={products} />
    </div>
  );
}
