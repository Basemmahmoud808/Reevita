import "server-only";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";
import { formatEGP } from "@/lib/format";
import { isSupabaseConfigured, siteUrl, supabaseAnonKey, supabaseUrl } from "@/lib/env";

type StoredSubscription = {
  endpoint: string;
  subscription: webPush.PushSubscription;
};

type NewOrderNotice = {
  orderId: string;
  orderNumber: string;
  total: number;
};

export async function notifyAdminOfNewOrder(order: NewOrderNotice): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const workerSecret = process.env.PUSH_WORKER_SECRET;
  if (!isSupabaseConfigured || !publicKey || !privateKey || !workerSecret) return;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-reevita-push-secret": workerSecret } },
  });
  const { data, error } = await supabase
    .from("admin_push_subscriptions")
    .select("endpoint, subscription");
  if (error) throw new Error("Unable to load admin push subscriptions");
  if (!data?.length) return;

  webPush.setVapidDetails(
    process.env.PUSH_VAPID_SUBJECT || "mailto:support@reevita-store.com",
    publicKey,
    privateKey,
  );

  const payload = JSON.stringify({
    title: "طلب جديد من ReeVita",
    body: `طلب ${order.orderNumber} جديد بقيمة ${formatEGP(order.total)}`,
    url: new URL(`/admin/orders/${order.orderId}`, siteUrl).toString(),
    tag: `reevita-order-${order.orderId}`,
  });

  const results = await Promise.allSettled(
    (data as StoredSubscription[]).map(async ({ endpoint, subscription }) => {
      try {
        await webPush.sendNotification(subscription, payload, { TTL: 60 * 60 * 24 });
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("admin_push_subscriptions").delete().eq("endpoint", endpoint);
          return;
        }
        throw error;
      }
    }),
  );
  if (results.some((result) => result.status === "rejected")) {
    console.error("[reevita] one or more admin push notifications could not be delivered");
  }
}
