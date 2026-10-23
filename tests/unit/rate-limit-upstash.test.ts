import assert from "node:assert/strict";
import test from "node:test";

// Must be set before the module is imported (it reads env at load time).
process.env.UPSTASH_REDIS_REST_URL = "https://upstash.test";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

const calls: { url: string; body: string; auth: string | null }[] = [];
let counter = 0;
let failNext = false;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  if (failNext) throw new Error("network down");
  calls.push({
    url: String(input),
    body: String(init?.body ?? ""),
    auth: new Headers(init?.headers).get("authorization"),
  });
  const command = JSON.parse(String(init?.body))[0];
  if (command === "INCR") counter += 1;
  return { ok: true, status: 200, json: async () => ({ result: counter }) } as Response;
}) as typeof fetch;

test("distributed limiter increments a shared counter and sets an expiry", async () => {
  const { rateLimit } = await import("@/lib/security/rate-limit");
  counter = 0;
  calls.length = 0;
  const key = "distributed-key";

  const first = await rateLimit(key, 2, 60_000);
  const second = await rateLimit(key, 2, 60_000);
  const third = await rateLimit(key, 2, 60_000);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false, "the shared counter must block across instances");

  const increment = calls.find((call) => call.body.includes("INCR"));
  assert.ok(increment, "INCR is sent");
  assert.equal(increment!.url, "https://upstash.test");
  assert.equal(increment!.auth, "Bearer test-token");
  assert.ok(calls.some((call) => call.body.includes("EXPIRE")), "EXPIRE is sent for the first hit");
});

test("a Redis outage degrades to the local limiter instead of failing open", async () => {
  const { rateLimit } = await import("@/lib/security/rate-limit");
  const errors: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => errors.push(args.join(" "));
  failNext = true;

  try {
    const result = await rateLimit(`fallback-${Date.now()}`, 1, 60_000);
    assert.equal(result.allowed, true, "requests are still served during an outage");
    assert.ok(errors.some((line) => line.includes("Upstash")), "the outage is logged");

    // Local protection still applies while Redis is unavailable.
    const key = `fallback-limit-${Date.now()}`;
    await rateLimit(key, 1, 60_000);
    const blocked = await rateLimit(key, 1, 60_000);
    assert.equal(blocked.allowed, false);
  } finally {
    failNext = false;
    console.error = originalError;
  }
});
