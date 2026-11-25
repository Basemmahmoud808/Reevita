import { requireAdmin } from "@/lib/auth/session";
import { getCollections, getProducts } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import {
  getMessengerStats,
  getWebhookVerifyToken,
  isMessengerConfigured,
} from "@/lib/messenger/facebook-bot";
import {
  AdminMessengerPanel,
  type MessengerCatalogItem,
} from "@/components/admin/admin-messenger-panel";

export const dynamic = "force-dynamic";

export default async function AdminMessengerPage() {
  await requireAdmin();

  const [stats, products, collections] = await Promise.all([
    getMessengerStats(),
    getProducts(),
    getCollections(),
  ]);

  const primaryProducts = products.filter((p) => p.isPrimarySizeOption);
  const catalogItems: MessengerCatalogItem[] = [
    ...collections.map((col) => ({
      id: `col:${col.slug}`,
      kind: "collection" as const,
      label: `مجموعة: ${col.nameEn} (${col.setCount ?? 0} Sets)`,
      title: `عرض جديد: ${col.nameEn} ✨`,
      message: `اكتشفي ${col.nameEn} من REEVITA — متاح الآن للطلب المباشر من المتجر!`,
      linkUrl: `/collections/${col.slug}`,
      imageUrl: col.image,
    })),
    ...primaryProducts.map((prod) => ({
      id: `prod:${prod.slug}`,
      kind: "product" as const,
      label: `${prod.nameAr || prod.nameEn} — ${formatEGP(prod.price)}`,
      title: `${prod.nameAr || prod.nameEn} — ${formatEGP(prod.price)}`,
      message: `وصل حديثاً من REEVITA! اطلبيه الآن بسعر ${formatEGP(prod.price)} مع التوصيل لجميع المحافظات.`,
      linkUrl: `/products/${prod.slug}`,
      imageUrl: prod.images[0]?.url ?? "",
    })),
  ];

  return (
    <AdminMessengerPanel
      configured={isMessengerConfigured()}
      hasVerifyToken={Boolean(getWebhookVerifyToken())}
      webhookUrl={`${siteUrl}/api/messenger/webhook`}
      stats={stats}
      catalogItems={catalogItems}
    />
  );
}
