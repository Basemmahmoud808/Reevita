import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, siteUrl, supabaseAnonKey, supabaseUrl } from "@/lib/env";

const GRAPH_API_VERSION = "v21.0";
const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

export type MessengerAudience = "all_eligible" | "window_24h" | "marketing_opted_in";

export interface MessengerSubscriberRow {
  psid: string;
  first_name: string | null;
  last_name: string | null;
  last_interaction_at: string;
  marketing_token: string | null;
  marketing_token_expires_at: string | null;
  marketing_opt_in: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessengerBroadcastRow {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  image_url: string | null;
  audience: MessengerAudience;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
}

export interface MessengerStats {
  totalSubscribers: number;
  active24hCount: number;
  marketingOptInCount: number;
  eligibleCount: number;
  recentBroadcasts: MessengerBroadcastRow[];
}

export interface BroadcastInput {
  title: string;
  message: string;
  linkUrl?: string;
  imageUrl?: string;
  buttonLabel?: string;
  audience: MessengerAudience;
  createdBy?: string;
}

export function getPageAccessToken(): string | undefined {
  return process.env.META_PAGE_ACCESS_TOKEN?.trim() || undefined;
}

export function getWebhookVerifyToken(): string | undefined {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || undefined;
}

export function isMessengerConfigured(): boolean {
  return Boolean(getPageAccessToken());
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function workerClient() {
  const workerSecret = process.env.PUSH_WORKER_SECRET?.trim();
  if (!isSupabaseConfigured || !workerSecret) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-reevita-push-secret": workerSecret } },
  });
}

function isWithin24Hours(isoDate: string): boolean {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < WINDOW_24H_MS;
}

function hasValidMarketingToken(row: MessengerSubscriberRow): boolean {
  if (!row.marketing_opt_in || !row.marketing_token) return false;
  if (!row.marketing_token_expires_at) return true;
  const exp = Date.parse(row.marketing_token_expires_at);
  return !Number.isNaN(exp) && exp > Date.now();
}

async function fetchUserProfile(psid: string, token: string): Promise<{ first_name?: string; last_name?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(psid)}?fields=first_name,last_name&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { first_name?: string; last_name?: string };
    return data;
  } catch {
    return {};
  }
}

export async function upsertMessengerSubscriber(input: {
  psid: string;
  firstName?: string | null;
  lastName?: string | null;
  lastInteractionAt?: string;
  marketingToken?: string | null;
  marketingTokenExpiresAt?: string | null;
  marketingOptIn?: boolean;
}): Promise<boolean> {
  const supabase = workerClient();
  if (!supabase || !/^[0-9]+$/.test(input.psid)) return false;

  let firstName = input.firstName ?? null;
  let lastName = input.lastName ?? null;

  const token = getPageAccessToken();
  if (!firstName && token) {
    const profile = await fetchUserProfile(input.psid, token);
    firstName = profile.first_name ?? null;
    lastName = profile.last_name ?? null;
  }

  const payload: Record<string, unknown> = {
    psid: input.psid,
    last_interaction_at: input.lastInteractionAt ?? new Date().toISOString(),
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (firstName !== null) payload.first_name = firstName;
  if (lastName !== null) payload.last_name = lastName;
  if (input.marketingToken !== undefined) payload.marketing_token = input.marketingToken;
  if (input.marketingTokenExpiresAt !== undefined) {
    payload.marketing_token_expires_at = input.marketingTokenExpiresAt;
  }
  if (input.marketingOptIn !== undefined) payload.marketing_opt_in = input.marketingOptIn;

  const { error } = await supabase
    .from("messenger_subscribers")
    .upsert(payload, { onConflict: "psid" });

  if (error) {
    console.error("[reevita][messenger] upsert subscriber failed:", error.message);
    return false;
  }
  return true;
}

async function callSendApi(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const token = getPageAccessToken();
  if (!token) return { ok: false, error: "META_PAGE_ACCESS_TOKEN is not configured" };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    if (res.ok) return { ok: true };
    const errText = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 180)}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

/**
 * Sends Meta's official Recurring Notifications (Marketing Messages) opt-in prompt
 * so the customer can subscribe to future offers & new product alerts beyond 24h.
 */
export async function sendMarketingOptInPrompt(psid: string): Promise<{ ok: boolean; error?: string }> {
  return callSendApi({
    recipient: { id: psid },
    messaging_type: "RESPONSE",
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "notification_messages",
          title: "اشتركي في عروض ومنتجات REEVITA الجديدة 🌸",
          payload: "REEVITA_OFFERS_OPT_IN",
          notification_messages_frequency: "WEEKLY",
          notification_messages_reoptin: "ENABLED",
        },
      },
    },
  });
}

export async function sendMessengerTextReply(psid: string, text: string): Promise<{ ok: boolean; error?: string }> {
  return callSendApi({
    recipient: { id: psid },
    messaging_type: "RESPONSE",
    message: { text },
  });
}

/**
 * Imports recent Facebook Page conversations via Graph API so existing chats
 * from the last 24h can be messaged immediately from /admin/messenger.
 */
export async function syncRecentPageConversations(): Promise<{
  ok: boolean;
  synced: number;
  error?: string;
}> {
  const token = getPageAccessToken();
  if (!token) {
    return { ok: false, synced: 0, error: "متغير META_PAGE_ACCESS_TOKEN غير مضاف في البيئة." };
  }

  try {
    // 1. Fetch Page ID so we don't store the Page itself as a subscriber
    const meRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me?fields=id&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!meRes.ok) {
      const text = await meRes.text().catch(() => "");
      return { ok: false, synced: 0, error: `تعذر التحقق من الصفحة: ${text.slice(0, 160)}` };
    }
    const meData = (await meRes.json()) as { id?: string };
    const pageId = meData.id;

    // 2. Fetch recent conversations
    const convRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/conversations?fields=participants,updated_time&limit=50&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!convRes.ok) {
      const text = await convRes.text().catch(() => "");
      return { ok: false, synced: 0, error: `تعذر جلب المحادثات: ${text.slice(0, 160)}` };
    }

    const convData = (await convRes.json()) as {
      data?: Array<{
        updated_time?: string;
        participants?: { data?: Array<{ id?: string; name?: string }> };
      }>;
    };

    let synced = 0;
    for (const conv of convData.data ?? []) {
      const participant = (conv.participants?.data ?? []).find(
        (p) => p.id && p.id !== pageId && /^[0-9]+$/.test(p.id),
      );
      if (!participant?.id) continue;

      const nameParts = (participant.name ?? "").trim().split(/\s+/).filter(Boolean);
      const saved = await upsertMessengerSubscriber({
        psid: participant.id,
        firstName: nameParts[0] ?? null,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
        lastInteractionAt: conv.updated_time ?? new Date().toISOString(),
      });
      if (saved) synced += 1;
    }

    return { ok: true, synced };
  } catch (err) {
    return {
      ok: false,
      synced: 0,
      error: err instanceof Error ? err.message : "خطأ غير متوقع أثناء المزامنة.",
    };
  }
}

export async function getMessengerStats(): Promise<MessengerStats> {
  const supabase = workerClient();
  if (!supabase) {
    return {
      totalSubscribers: 0,
      active24hCount: 0,
      marketingOptInCount: 0,
      eligibleCount: 0,
      recentBroadcasts: [],
    };
  }

  const [subsResult, broadcastsResult] = await Promise.all([
    supabase
      .from("messenger_subscribers")
      .select("*")
      .eq("is_active", true)
      .order("last_interaction_at", { ascending: false })
      .limit(1000),
    supabase
      .from("messenger_broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const rows = (subsResult.data ?? []) as MessengerSubscriberRow[];
  let active24hCount = 0;
  let marketingOptInCount = 0;
  let eligibleCount = 0;

  for (const row of rows) {
    const in24h = isWithin24Hours(row.last_interaction_at);
    const hasMarketing = hasValidMarketingToken(row);
    if (in24h) active24hCount += 1;
    if (hasMarketing) marketingOptInCount += 1;
    if (in24h || hasMarketing) eligibleCount += 1;
  }

  return {
    totalSubscribers: rows.length,
    active24hCount,
    marketingOptInCount,
    eligibleCount,
    recentBroadcasts: (broadcastsResult.data ?? []) as MessengerBroadcastRow[],
  };
}

function buildAbsoluteUrl(rawUrl?: string): string | undefined {
  const cleaned = rawUrl?.trim();
  if (!cleaned) return undefined;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `${siteUrl}${cleaned.startsWith("/") ? cleaned : `/${cleaned}`}`;
}

function buildOfferMessagePayload(input: BroadcastInput): Record<string, unknown> {
  const targetUrl = buildAbsoluteUrl(input.linkUrl) || siteUrl;
  const imageUrl = buildAbsoluteUrl(input.imageUrl);
  const buttonTitle = (input.buttonLabel?.trim() || "اطلبي الآن 🛍️").slice(0, 20);

  if (imageUrl) {
    return {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: input.title.slice(0, 80),
              subtitle: input.message.slice(0, 80),
              image_url: imageUrl,
              default_action: {
                type: "web_url",
                url: targetUrl,
                webview_height_ratio: "tall",
              },
              buttons: [
                {
                  type: "web_url",
                  url: targetUrl,
                  title: buttonTitle,
                },
              ],
            },
          ],
        },
      },
    };
  }

  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: `${input.title}\n\n${input.message}`.slice(0, 640),
        buttons: [
          {
            type: "web_url",
            url: targetUrl,
            title: buttonTitle,
          },
        ],
      },
    },
  };
}

export async function sendMessengerOfferBroadcast(input: BroadcastInput): Promise<{
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
}> {
  if (!isMessengerConfigured()) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: "متغير META_PAGE_ACCESS_TOKEN غير مضاف في إعدادات البيئة.",
    };
  }

  const supabase = workerClient();
  if (!supabase) {
    return {
      ok: false,
      sent: 0,
      failed: 0,
      skipped: 0,
      error: "اتصال قاعدة البيانات غير مهيأ.",
    };
  }

  const { data, error } = await supabase
    .from("messenger_subscribers")
    .select("*")
    .eq("is_active", true)
    .order("last_interaction_at", { ascending: false })
    .limit(500);

  if (error) {
    return { ok: false, sent: 0, failed: 0, skipped: 0, error: error.message };
  }

  const subscribers = (data ?? []) as MessengerSubscriberRow[];
  const messagePayload = buildOfferMessagePayload(input);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const sub of subscribers) {
    const in24h = isWithin24Hours(sub.last_interaction_at);
    const hasMarketing = hasValidMarketingToken(sub);

    let useMarketingToken = false;
    if (input.audience === "window_24h") {
      if (!in24h) {
        skipped += 1;
        continue;
      }
    } else if (input.audience === "marketing_opted_in") {
      if (!hasMarketing) {
        skipped += 1;
        continue;
      }
      useMarketingToken = true;
    } else {
      // all_eligible
      if (in24h) {
        useMarketingToken = false;
      } else if (hasMarketing) {
        useMarketingToken = true;
      } else {
        skipped += 1;
        continue;
      }
    }

    const requestBody: Record<string, unknown> = useMarketingToken
      ? {
          recipient: { notification_messages_token: sub.marketing_token },
          messaging_type: "UPDATE",
          message: messagePayload,
        }
      : {
          recipient: { id: sub.psid },
          messaging_type: "RESPONSE",
          message: messagePayload,
        };

    const result = await callSendApi(requestBody);
    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  await supabase.from("messenger_broadcasts").insert({
    title: input.title.slice(0, 120),
    message: input.message.slice(0, 1000),
    link_url: buildAbsoluteUrl(input.linkUrl) ?? null,
    image_url: buildAbsoluteUrl(input.imageUrl) ?? null,
    audience: input.audience,
    sent_count: sent,
    failed_count: failed,
    created_by: input.createdBy ?? null,
  });

  return { ok: true, sent, failed, skipped };
}

export async function sendOptInInviteToActive24h(): Promise<{
  ok: boolean;
  sent: number;
  failed: number;
  error?: string;
}> {
  if (!isMessengerConfigured()) {
    return { ok: false, sent: 0, failed: 0, error: "متغير META_PAGE_ACCESS_TOKEN غير مضاف." };
  }
  const supabase = workerClient();
  if (!supabase) {
    return { ok: false, sent: 0, failed: 0, error: "اتصال قاعدة البيانات غير مهيأ." };
  }

  const { data, error } = await supabase
    .from("messenger_subscribers")
    .select("*")
    .eq("is_active", true)
    .eq("marketing_opt_in", false)
    .limit(200);

  if (error) return { ok: false, sent: 0, failed: 0, error: error.message };

  let sent = 0;
  let failed = 0;

  for (const sub of (data ?? []) as MessengerSubscriberRow[]) {
    if (!isWithin24Hours(sub.last_interaction_at)) continue;
    const res = await sendMarketingOptInPrompt(sub.psid);
    if (res.ok) sent += 1;
    else failed += 1;
  }

  return { ok: true, sent, failed };
}
