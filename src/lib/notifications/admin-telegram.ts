import "server-only";

import { formatEGP } from "@/lib/format";
import { siteUrl } from "@/lib/env";

type NewOrderNotice = {
  orderId: string;
  orderNumber: string;
  total: number;
};

type TelegramSendMessageResponse = {
  ok?: boolean;
};

/** Sends a private Telegram message to the configured admin chat. */
export async function notifyAdminViaTelegram(order: NewOrderNotice): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `طلب جديد من ReeVita\nرقم الطلب: ${order.orderNumber}\nالإجمالي: ${formatEGP(order.total)}`,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{
          text: "فتح الطلب في لوحة الإدارة",
          url: new URL(`/admin/orders/${encodeURIComponent(order.orderId)}`, siteUrl).toString(),
        }]],
      },
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Telegram notification failed with status ${response.status}`);
  const result = (await response.json()) as TelegramSendMessageResponse;
  if (!result.ok) throw new Error("Telegram did not accept the admin notification");
}
