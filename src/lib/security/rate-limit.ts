import { createHash } from "node:crypto";

/**
 * Lightweight in-process rate limiter.
 *
 * Good enough to stop casual abuse on a single Node instance (local, VPS, or a
 * single Vercel region). When `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
 * are configured a shared Redis counter is used instead, which is required for
 * multi-instance / serverless deployments. If Upstash is configured but fails,
 * the limiter degrades to the in-process bucket (logged) rather than failing the
 * request open to unlimited traffic.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

async function upstashRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const response = await fetch(upstashUrl!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["INCR", key]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash rate limit returned ${response.status}`);
  const result = (await response.json()) as { result?: number };
  const count = Number(result.result);
  if (!Number.isInteger(count) || count < 1) throw new Error("Upstash rate limit returned an invalid count");

  if (count === 1) {
    const expireResponse = await fetch(upstashUrl!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["EXPIRE", key, Math.max(1, Math.ceil(windowMs / 1000))]),
      cache: "no-store",
    });
    if (!expireResponse.ok) throw new Error(`Upstash expiry returned ${expireResponse.status}`);
  }

  return count > limit
    ? { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)) }
    : { allowed: true, remaining: limit - count, retryAfterSeconds: 0 };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (upstashUrl && upstashToken) {
    try {
      return await upstashRateLimit(key, limit, windowMs);
    } catch (error) {
      console.error("[reevita] Upstash rate limit failed; using local fallback", error);
    }
  }
  return localRateLimit(key, limit, windowMs);
}

/**
 * Stable, non-reversible key for values that must never be logged or stored in
 * clear (phone numbers, emails). Rate-limit keys are written to Redis when
 * Upstash is configured, so hashing keeps personal data out of that store.
 */
export function hashedKey(scope: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  const digest = createHash("sha256").update(normalized).digest("hex").slice(0, 32);
  return `${scope}:${digest}`;
}

/**
 * Resolve the client address used for rate limiting.
 *
 * Trust model: the app is expected to sit behind a proxy that *appends* the
 * client address to `x-forwarded-for`. Only proxy-controlled values are used:
 *
 *  1. Vercel: `x-vercel-forwarded-for` is injected by the platform and cannot be
 *     spoofed by the browser.
 *  2. `TRUSTED_IP_HEADER` (optional): an operator-declared header set by their
 *     own edge proxy (e.g. `cf-connecting-ip`, `x-real-ip`).
 *  3. Otherwise the right-most `x-forwarded-for` entry (the hop appended by the
 *     closest proxy). Client-supplied left-hand entries are ignored.
 *
 * A raw `x-real-ip` from an untrusted caller is deliberately NOT trusted on its
 * own, because it is trivially spoofed and would let an attacker rotate the
 * limiter key at will. When no trustworthy header exists the caller falls back
 * to the "unknown" bucket, which is intentionally strict.
 */
export function clientIp(headers: Headers): string {
  if (process.env.VERCEL) {
    const vercelIp = headers.get("x-vercel-forwarded-for")?.split(",").at(-1)?.trim();
    if (vercelIp) return vercelIp;
  }

  const configuredHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (configuredHeader) {
    const configuredValue = headers
      .get(configuredHeader)
      ?.split(",")
      .at(-1)
      ?.trim();
    if (configuredValue) return configuredValue;
  }

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)?.trim() || "unknown";

  return "unknown";
}
