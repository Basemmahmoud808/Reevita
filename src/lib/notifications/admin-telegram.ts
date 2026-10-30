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
  description?: string;
  error_code?: number;
};

export class TelegramNotificationError extends Error {
  constructor(readonly code: number | "not_configured" | "network") {
    super("Telegram notification failed");
    this.name = "TelegramNotificationError";
  }
}

function telegramCredentials() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN?.trim(),
    chatId: process.env.TELEGRAM_ADMIN_CHAT_ID?.trim(),
  };
}

export function telegramAdminConfigured(): boolean {
  const { token, chatId } = telegramCredentials();
  return Boolean(token && chatId);
}

export function telegramNotificationErrorMessage(error: unknown): string {
  if (!(error instanceof TelegramNotificationError)) return "تعذّر الاتصال بخدمة Telegram. حاول مرة أخرى.";
  if (error.code === "not_configured") return "إعداد Telegram غير مكتمل في إعدادات الإنتاج.";
  if (error.code === 401) return "رمز البوت غير صالح. راجع TELEGRAM_BOT_TOKEN في إعدادات Vercel.";
  if (error.code === 400) return "تعذّر العثور على محادثة البوت. افتح البوت وأرسل /start، وتأكد من رقم المحادثة.";
  if (error.code === 403) return "البوت غير مسموح له بإرسال رسالة إلى هذه المحادثة. تأكد أنك لم تحظره.";
  return `رفض Telegram الرسالة (رمز الخطأ ${error.code}).`;
}

async function sendTelegramMessage(text: string, buttonLabel: string, buttonUrl: string): Promise<void> {
  const { token, chatId } = telegramCredentials();
  if (!token || !chatId) throw new TelegramNotificationError("not_configured");

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: buttonLabel, url: buttonUrl }]] },
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
  } catch {
    throw new TelegramNotificationError("network");
  }

  let result: TelegramSendMessageResponse;
  try {
    result = (await response.json()) as TelegramSendMessageResponse;
  } catch {
    throw new TelegramNotificationError(response.status || "network");
  }
  if (!response.ok || !result.ok) {
    throw new TelegramNotificationError(result.error_code ?? response.status);
  }
}

/** Sends a private Telegram message to the configured admin chat. */
export async function notifyAdminViaTelegram(order: NewOrderNotice): Promise<void> {
  if (!telegramAdminConfigured()) return;
  try {
    await sendTelegramMessage(
      `طلب جديد من ReeVita\nرقم الطلب: ${order.orderNumber}\nالإجمالي: ${formatEGP(order.total)}`,
      "فتح الطلب في لوحة الإدارة",
      new URL(`/admin/orders/${encodeURIComponent(order.orderId)}`, siteUrl).toString(),
    );
  } catch (error) {
    const code = error instanceof TelegramNotificationError ? error.code : "network";
    console.error("[reevita] Telegram order notification failed", { code });
    throw error;
  }
}

/** Sends a one-time configuration test from the authenticated admin dashboard. */
export async function sendTelegramAdminTest(): Promise<void> {
  if (!telegramAdminConfigured()) throw new TelegramNotificationError("not_configured");
  await sendTelegramMessage(
    "رسالة اختبار من ReeVita: إعداد إشعارات الطلبات يعمل.",
    "فتح لوحة الإدارة",
    new URL("/admin", siteUrl).toString(),
  );
}
