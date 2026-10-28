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
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const pipelineUrl = upstashUrl!.replace(/\/$/, "") + "/pipeline";
  const response = await fetch(pipelineUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds, "NX"],
    ]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash rate limit returned ${response.status}`);
  const results = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  const count = Number(results[0]?.result);
  if (!Number.isInteger(count) || count < 1) throw new Error("Upstash rate limit returned an invalid count");

  return count > limit
    ? { allowed: false, remaining: 0, retryAfterSeconds: ttlSeconds }
    : { allowed: true, remaining: limit - count, retryAfterSeconds: 0 };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (upstashUrl && upstashToken) {
    try {
      return await upstashRateLimit(key, limit, windowMs);
    } catch (error) {
      console.error("[reevita] Upstash rate limit failed; denying the request", error);
      return { allowed: false, remaining: 0, retryAfterSeconds: 60 };
    }
  }
  return localRateLimit(key, limit, windowMs);
}

export function clientIp(headers: Headers): string {
  const trustedVercelIp = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (trustedVercelIp) return trustedVercelIp;

  const trustedProxyIp = headers.get("x-real-ip")?.trim();
  if (trustedProxyIp) return trustedProxyIp;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
}
