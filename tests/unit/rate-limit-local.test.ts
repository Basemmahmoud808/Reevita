import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "@/lib/security/rate-limit";

// No Upstash env vars in this process, so the in-process limiter is exercised.
test("local limiter allows up to the limit then blocks with retry guidance", async () => {
  const key = `local-${Date.now()}`;
  const results = [];
  for (let i = 0; i < 4; i += 1) results.push(await rateLimit(key, 3, 60_000));

  assert.deepEqual(results.map((r) => r.allowed), [true, true, true, false]);
  assert.deepEqual(results.map((r) => r.remaining), [2, 1, 0, 0]);
  assert.ok(results[3]!.retryAfterSeconds > 0);
});

test("local limiter keeps buckets isolated per key", async () => {
  const a = `iso-a-${Date.now()}`;
  const b = `iso-b-${Date.now()}`;
  await rateLimit(a, 1, 60_000);
  const blocked = await rateLimit(a, 1, 60_000);
  const otherAllowed = await rateLimit(b, 1, 60_000);

  assert.equal(blocked.allowed, false);
  assert.equal(otherAllowed.allowed, true);
});

test("local limiter resets after the window elapses", async () => {
  const key = `window-${Date.now()}`;
  assert.equal((await rateLimit(key, 1, 40)).allowed, true);
  assert.equal((await rateLimit(key, 1, 40)).allowed, false);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal((await rateLimit(key, 1, 40)).allowed, true);
});
