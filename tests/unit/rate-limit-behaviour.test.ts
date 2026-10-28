import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "@/lib/security/rate-limit";

test("rateLimit blocks requests beyond the configured limit and reports a retry delay", async () => {
  const key = `test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  // Ensure Upstash is not configured so the deterministic local bucket is used.
  assert.equal(process.env.UPSTASH_REDIS_REST_URL, undefined);

  const results = [];
  for (let index = 0; index < 4; index += 1) {
    results.push(await rateLimit(key, 2, 60_000));
  }

  assert.deepEqual(
    results.map((result) => result.allowed),
    [true, true, false, false],
  );
  assert.equal(results[2]!.remaining, 0);
  assert.ok(results[2]!.retryAfterSeconds > 0, "blocked callers must receive a retry delay");
});

test("rateLimit keys are independent and windows reset", async () => {
  const keyA = `window-a-${Date.now()}`;
  const keyB = `window-b-${Date.now()}`;

  assert.equal((await rateLimit(keyA, 1, 30)).allowed, true);
  assert.equal((await rateLimit(keyA, 1, 30)).allowed, false);
  assert.equal((await rateLimit(keyB, 1, 30)).allowed, true, "counters must be scoped per key");

  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal((await rateLimit(keyA, 1, 30)).allowed, true, "the window must reset");
});
