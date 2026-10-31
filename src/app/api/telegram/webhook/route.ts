import { NextResponse } from "next/server";
import {
  hasTelegramWebhookSecret,
  registerTelegramSubscriber,
  sendTelegramSubscriptionReply,
} from "@/lib/notifications/admin-telegram";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
      first_name?: string;
      username?: string;
    };
  };
};

export async function POST(request: Request) {
  if (!hasTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const chat = update.message?.chat;
  const text = update.message?.text?.trim().toLowerCase();
  if (!chat || chat.type !== "private" || chat.id === undefined) return NextResponse.json({ ok: true });

  const isStopping = text === "/stop" || text?.startsWith("/stop@") === true;
  const updated = await registerTelegramSubscriber(chat, !isStopping);
  if (!updated) return NextResponse.json({ ok: false }, { status: 503 });

  await sendTelegramSubscriptionReply(
    String(chat.id),
    isStopping
      ? "تم إيقاف إشعارات الطلبات لهذا الحساب. أرسل /start لتفعيلها مرة أخرى."
      : "تم تفعيل إشعارات الطلبات لهذا الحساب. ستصلك الطلبات الجديدة تلقائيًا. أرسل /stop لإيقافها.",
  );
  return NextResponse.json({ ok: true });
}
