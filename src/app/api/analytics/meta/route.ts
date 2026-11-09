import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { sendMetaServerEvent } from "@/lib/analytics/meta-capi";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      eventName?: string;
      eventId?: string;
      eventSourceUrl?: string;
      customData?: Record<string, unknown>;
      userData?: {
        phone?: string;
        email?: string;
        fullName?: string;
        city?: string;
        fbp?: string;
        fbc?: string;
      };
      testEventCode?: string;
    } | null;

    if (!body || !body.eventName || !ALLOWED_EVENTS.has(body.eventName)) {
      return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
    }

    const headerStore = await headers();
    const cookieStore = await cookies();

    const limited = await rateLimit(`meta-capi:${clientIp(headerStore)}`, 120, 60 * 1000);
    if (!limited.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
      );
    }

    const forwardedFor = headerStore.get("x-forwarded-for");
    const clientIpAddress = forwardedFor
      ? forwardedFor.split(",")[0]?.trim() || null
      : headerStore.get("x-real-ip");
    const clientUserAgent = headerStore.get("user-agent");

    const fbp = body.userData?.fbp || cookieStore.get("_fbp")?.value || null;
    const fbc = body.userData?.fbc || cookieStore.get("_fbc")?.value || null;

    const result = await sendMetaServerEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl || headerStore.get("referer") || undefined,
      customData: body.customData,
      userData: {
        phone: body.userData?.phone,
        email: body.userData?.email,
        fullName: body.userData?.fullName,
        city: body.userData?.city,
        clientIpAddress,
        clientUserAgent,
        fbp,
        fbc,
      },
      testEventCode: body.testEventCode,
    });

    return NextResponse.json({
      ok: true,
      pixelId: META_PIXEL_ID,
      ...result,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
