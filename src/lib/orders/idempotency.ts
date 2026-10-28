import { createHash } from "node:crypto";
import { normalizeEgyptianPhone } from "@/lib/phone";
import type { CheckoutPayload } from "@/lib/types";

/** Keys accepted by `public.place_order(p_idempotency_key => …)`. */
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/;

/** Returns a well-formed key or null (so the caller can derive a fallback). */
export function normalizeIdempotencyKey(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return IDEMPOTENCY_KEY_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Server-side fallback key for clients that cannot send one (for example a
 * browser with JavaScript disabled or an interrupted hydration).
 *
 * It hashes the trusted parts of the checkout payload and buckets them into a
 * 10-minute window, so an accidental double submit is deduplicated while a
 * genuinely new, identical purchase later in the day is still accepted. The
 * phone number is hashed — it is never stored in clear inside the key.
 */
export function deriveIdempotencyKey(payload: CheckoutPayload, now: number = Date.now()): string {
  const phone = normalizeEgyptianPhone(payload.customerPhone) ?? payload.customerPhone;
  const signature = JSON.stringify({
    phone,
    governorateId: payload.governorateId,
    addressLine: payload.addressLine.trim().toLowerCase(),
    items: [...payload.items]
      .map((item) => `${item.product_id}:${item.quantity}`)
      .sort()
      .join(","),
    window: Math.floor(now / (10 * 60 * 1000)),
  });
  const digest = createHash("sha256").update(signature).digest("hex").slice(0, 40);
  return `auto-${digest}`;
}
