import "server-only";
import crypto from "node:crypto";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";

const GRAPH_API_VERSION = "v21.0";

export interface MetaUserDataInput {
  phone?: string | null;
  email?: string | null;
  fullName?: string | null;
  city?: string | null;
  country?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  externalId?: string | null;
}

export interface MetaServerEventInput {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: "website";
  customData?: Record<string, unknown>;
  userData?: MetaUserDataInput;
  testEventCode?: string | null;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const cleaned = email.trim().toLowerCase();
  return cleaned ? sha256(cleaned) : undefined;
}

/**
 * Normalizes an Egyptian phone number to E.164 digits (e.g. 201012345678) and hashes with SHA-256.
 */
function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("0020")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("01") && digits.length === 11) {
    digits = `2${digits}`;
  } else if (digits.length === 10 && /^1[0125]\d{8}$/.test(digits)) {
    digits = `20${digits}`;
  }
  return sha256(digits);
}

function normalizeName(fullName?: string | null): { fn?: string; ln?: string } {
  if (!fullName) return {};
  const parts = fullName
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  const firstPart = parts[0];
  if (!firstPart) return {};
  const fn = sha256(firstPart);
  const ln = parts.length > 1 ? sha256(parts.slice(1).join("")) : undefined;
  return { fn, ln };
}

function normalizeCity(city?: string | null): string | undefined {
  if (!city) return undefined;
  const cleaned = city.trim().toLowerCase().replace(/\s+/g, "");
  return cleaned ? sha256(cleaned) : undefined;
}

/**
 * Sends an event to Meta Conversions API (Graph API) when META_CONVERSIONS_API_TOKEN is configured,
 * and also sends a server-side tracking beacon to facebook.com/tr as a resilient fallback.
 */
export async function sendMetaServerEvent(input: MetaServerEventInput): Promise<{
  capiSent: boolean;
  beaconSent: boolean;
  error?: string;
}> {
  const accessToken =
    process.env.META_CONVERSIONS_API_TOKEN ||
    process.env.META_CAPI_TOKEN ||
    process.env.FB_ACCESS_TOKEN ||
    "";

  const testEventCode =
    input.testEventCode ||
    process.env.META_TEST_EVENT_CODE ||
    process.env.FB_TEST_EVENT_CODE ||
    undefined;

  const eventTime = Math.floor(Date.now() / 1000);
  const eventId = input.eventId || `${input.eventName}_${Date.now()}`;
  const sourceUrl = input.eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://reevita-store.vercel.app";

  const { fn, ln } = normalizeName(input.userData?.fullName);
  const ph = normalizePhone(input.userData?.phone);
  const em = normalizeEmail(input.userData?.email);
  const ct = normalizeCity(input.userData?.city);
  const country = sha256((input.userData?.country || "eg").trim().toLowerCase());

  const userDataPayload: Record<string, unknown> = {
    country: [country],
  };
  if (ph) userDataPayload.ph = [ph];
  if (em) userDataPayload.em = [em];
  if (fn) userDataPayload.fn = [fn];
  if (ln) userDataPayload.ln = [ln];
  if (ct) userDataPayload.ct = [ct];
  if (input.userData?.clientIpAddress) {
    userDataPayload.client_ip_address = input.userData.clientIpAddress;
  }
  if (input.userData?.clientUserAgent) {
    userDataPayload.client_user_agent = input.userData.clientUserAgent;
  }
  if (input.userData?.fbp) {
    userDataPayload.fbp = input.userData.fbp;
  }
  if (input.userData?.fbc) {
    userDataPayload.fbc = input.userData.fbc;
  }
  if (input.userData?.externalId) {
    userDataPayload.external_id = [sha256(String(input.userData.externalId).trim())];
  }

  let capiSent = false;
  let errorMsg: string | undefined;

  if (accessToken) {
    try {
      const body: Record<string, unknown> = {
        data: [
          {
            event_name: input.eventName,
            event_time: eventTime,
            event_id: eventId,
            action_source: input.actionSource || "website",
            event_source_url: sourceUrl,
            user_data: userDataPayload,
            custom_data: input.customData || {},
          },
        ],
      };

      if (testEventCode) {
        body.test_event_code = testEventCode;
      }

      const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (response.ok) {
        capiSent = true;
      } else {
        const text = await response.text().catch(() => "");
        errorMsg = `CAPI HTTP ${response.status}: ${text.slice(0, 200)}`;
        console.error("[reevita][meta-capi]", errorMsg);
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Unknown CAPI error";
      console.error("[reevita][meta-capi]", errorMsg);
    }
  }

  // Also send server-side /tr pixel beacon when CAPI token isn't configured so events still reach Meta
  let beaconSent = false;
  if (!capiSent) {
    try {
      const params = new URLSearchParams({
        id: META_PIXEL_ID,
        ev: input.eventName,
        dl: sourceUrl,
        rl: "",
        if: "false",
        ts: String(Date.now()),
        v: "2.9.438",
        r: "stable",
        ec: "1",
        o: "30",
        eid: eventId,
        it: String(Date.now()),
        coo: "false",
        rqm: "GET",
      });

      if (input.userData?.fbp) {
        params.set("fbp", input.userData.fbp);
      }
      if (input.userData?.fbc) {
        params.set("fbc", input.userData.fbc);
      }

      if (input.customData) {
        for (const [key, val] of Object.entries(input.customData)) {
          if (val === undefined || val === null) continue;
          params.set(
            `cd[${key}]`,
            typeof val === "object" ? JSON.stringify(val) : String(val),
          );
        }
      }

      const headers: Record<string, string> = {
        Referer: sourceUrl,
      };
      if (input.userData?.clientUserAgent) {
        headers["User-Agent"] = input.userData.clientUserAgent;
      }
      if (input.userData?.clientIpAddress) {
        headers["X-Forwarded-For"] = input.userData.clientIpAddress;
      }

      const trRes = await fetch(`https://www.facebook.com/tr/?${params.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      beaconSent = trRes.ok;
    } catch {
      // Ignore fallback network errors
    }
  }

  return { capiSent, beaconSent, error: errorMsg };
}
