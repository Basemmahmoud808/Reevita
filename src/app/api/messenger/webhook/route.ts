import { NextResponse } from "next/server";
import {
  getWebhookVerifyToken,
  sendMarketingOptInPrompt,
  sendMessengerTextReply,
  upsertMessengerSubscriber,
  verifyMetaWebhookSignature,
} from "@/lib/messenger/facebook-bot";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type MetaWebhookEvent = {
  sender?: { id?: string };
  timestamp?: number;
  message?: {
    text?: string;
    is_echo?: boolean;
  };
  postback?: {
    payload?: string;
  };
  optin?: {
    type?: string;
    payload?: string;
    notification_messages_token?: string;
    token_expiry_timestamp?: number;
    notification_messages_status?: string;
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    messaging?: MetaWebhookEvent[];
  }>;
};

/**
 * Meta Webhook Verification Handshake (GET)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expectedToken = getWebhookVerifyToken();

  if (mode === "subscribe" && expectedToken && token === expectedToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

/**
 * Meta Webhook Event Receiver (POST)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let body: MetaWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MetaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.object !== "page") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const psid = event.sender?.id;
      if (!psid || !/^[0-9]+$/.test(psid)) continue;

      // Ignore Page's own echo messages
      if (event.message?.is_echo) continue;

      // 1. Handle Recurring Notifications (Marketing Messages) Opt-In
      if (event.optin?.type === "notification_messages" && event.optin.notification_messages_token) {
        const expiresAt = event.optin.token_expiry_timestamp
          ? new Date(event.optin.token_expiry_timestamp * 1000).toISOString()
          : null;
        const isStopped = event.optin.notification_messages_status === "STOP_NOTIFICATIONS";

        await upsertMessengerSubscriber({
          psid,
          marketingToken: isStopped ? null : event.optin.notification_messages_token,
          marketingTokenExpiresAt: expiresAt,
          marketingOptIn: !isStopped,
        });

        if (!isStopped) {
          await sendMessengerTextReply(
            psid,
            `أهلاً بكِ في REEVITA 🌸 تم اشتراكك بنجاح في إشعارات العروض والمنتجات الجديدة!\nتصفحي المتجر الآن: ${siteUrl}`,
          );
        }
        continue;
      }

      // 2. Record customer message / postback interaction (opens 24h window)
      await upsertMessengerSubscriber({
        psid,
        lastInteractionAt: event.timestamp
          ? new Date(event.timestamp).toISOString()
          : new Date().toISOString(),
      });

      const text = event.message?.text?.trim().toLowerCase() ?? "";
      const isOptInKeyword =
        event.postback?.payload === "GET_STARTED" ||
        text.includes("عروض") ||
        text.includes("عرض") ||
        text.includes("اشتراك") ||
        text.includes("offers");

      if (isOptInKeyword) {
        await sendMarketingOptInPrompt(psid);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
