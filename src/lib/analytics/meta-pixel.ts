declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = "1146539657836690";

interface PendingBrowserEvent {
  event: string;
  params: Record<string, unknown>;
  eventId: string;
}

const MAX_QUEUE_LENGTH = 50;
const POLL_INTERVAL_MS = 100;
const MAX_POLL_DURATION_MS = 10_000;
const MAX_POLL_ATTEMPTS = Math.ceil(MAX_POLL_DURATION_MS / POLL_INTERVAL_MS);

const pendingBrowserEvents: PendingBrowserEvent[] = [];
let retryTimer: ReturnType<typeof setInterval> | null = null;
let readyListener: (() => void) | null = null;

function stopPollingAndCleanup() {
  if (retryTimer !== null) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
  if (readyListener !== null && typeof window !== "undefined") {
    window.removeEventListener("meta-pixel-ready", readyListener);
    readyListener = null;
  }
}

function flushPendingBrowserEvents(): boolean {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  while (pendingBrowserEvents.length > 0) {
    const item = pendingBrowserEvents.shift();
    if (!item) break;
    try {
      window.fbq("track", item.event, item.params, { eventID: item.eventId });
    } catch {
      // Never throw if fbq is blocked or fails
    }
  }

  stopPollingAndCleanup();
  return true;
}

function enqueueBrowserEvent(
  event: string,
  params: Record<string, unknown>,
  eventId: string,
) {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    flushPendingBrowserEvents();
    try {
      window.fbq("track", event, params, { eventID: eventId });
    } catch {
      // Never throw if fbq is blocked or fails
    }
    return;
  }

  if (pendingBrowserEvents.length >= MAX_QUEUE_LENGTH) {
    pendingBrowserEvents.shift();
  }
  pendingBrowserEvents.push({ event, params, eventId });

  if (readyListener === null) {
    readyListener = () => {
      flushPendingBrowserEvents();
    };
    window.addEventListener("meta-pixel-ready", readyListener);
  }

  if (retryTimer === null) {
    let attempts = 0;
    retryTimer = setInterval(() => {
      attempts += 1;
      if (flushPendingBrowserEvents()) {
        return;
      }
      if (attempts >= MAX_POLL_ATTEMPTS) {
        pendingBrowserEvents.length = 0;
        stopPollingAndCleanup();
      }
    }, POLL_INTERVAL_MS);
  }
}

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
 * Dispatches a Meta Pixel event both to the browser pixel (`window.fbq`),
 * queuing until the pixel script has initialized if needed, and to our
 * server-side Conversions API endpoint (`/api/analytics/meta`) with shared
 * `event_id` deduplication.
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

  if (!options?.skipBrowser) {
    enqueueBrowserEvent(event, params ?? {}, eventId);
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
