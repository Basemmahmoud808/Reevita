declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = "1146539657836690";

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function generateEventId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Dispatches a Meta Pixel event both to the browser pixel (`window.fbq`)
 * and to our server-side Conversions API endpoint (`/api/analytics/meta`)
 * with shared `event_id` deduplication.
 */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
  options?: {
    eventId?: string;
    skipBrowser?: boolean;
    skipServer?: boolean;
    userData?: {
      phone?: string;
      email?: string;
      fullName?: string;
      city?: string;
    };
  },
) {
  if (typeof window === "undefined") return;

  const eventId = options?.eventId || generateEventId(event.toLowerCase());

  if (!options?.skipBrowser && typeof window.fbq === "function") {
    if (params) {
      window.fbq("track", event, params, { eventID: eventId });
    } else {
      window.fbq("track", event, {}, { eventID: eventId });
    }
  }

  if (!options?.skipServer) {
    const fbp = getCookieValue("_fbp");
    let fbc = getCookieValue("_fbc");
    if (!fbc) {
      try {
        const fbclid = new URLSearchParams(window.location.search).get("fbclid");
        if (fbclid) {
          fbc = `fb.1.${Date.now()}.${fbclid}`;
        }
      } catch {
        // ignore URL parse issues
      }
    }

    const payload = JSON.stringify({
      eventName: event,
      eventId,
      eventSourceUrl: window.location.href,
      customData: params || {},
      userData: {
        ...options?.userData,
        fbp,
        fbc,
      },
    });

    try {
      fetch("/api/analytics/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Never disrupt user experience if analytics fails
      });
    } catch {
      // Ignore fetch errors
    }
  }
}
