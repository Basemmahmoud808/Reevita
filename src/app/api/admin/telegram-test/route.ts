import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  sendTelegramAdminTest,
  telegramNotificationErrorMessage,
} from "@/lib/notifications/admin-telegram";

export const dynamic = "force-dynamic";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });

  try {
    await sendTelegramAdminTest();
    return NextResponse.json({ success: true, message: "تم إرسال رسالة الاختبار إلى Telegram." });
  } catch (error) {
    const message = telegramNotificationErrorMessage(error);
    console.error("[reevita] admin Telegram test failed", {
      code: error instanceof Error && "code" in error ? error.code : "unknown",
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
