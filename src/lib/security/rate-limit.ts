/**
 * Lightweight in-process rate limiter.
 *
 * Good enough to stop casual abuse on a single Node instance (local, VPS, or a
 * single Vercel region). For multi-region serverless deployments put a durable
 * limiter in front (Upstash Redis / Cloudflare Turnstile). This is documented in
 * docs/SECURITY.md.
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

export function clientIp(headers: Headers): string {
  const trustedVercelIp = headers.get("x-vercel-forwarded-for")?.split(",").at(-1)?.trim();
  if (trustedVercelIp) return trustedVercelIp;

  const trustedProxyIp = headers.get("x-real-ip")?.trim();
  if (trustedProxyIp) return trustedProxyIp;

  // Assumption: the hosting proxy appends its address to x-forwarded-for,
  // making the right-most value the last proxy-validated client address.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)?.trim() || "unknown";
  return "unknown";
}
