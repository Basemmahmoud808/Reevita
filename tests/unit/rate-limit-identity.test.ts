import assert from "node:assert/strict";
import test from "node:test";
import { clientIp, hashedKey } from "@/lib/security/rate-limit";

function headersOf(entries: Record<string, string>): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(entries)) headers.set(key, value);
  return headers;
}

test("clientIp ignores client-supplied x-real-ip when x-forwarded-for is present", () => {
  const headers = headersOf({
    "x-forwarded-for": "203.0.113.9, 198.51.100.7",
    "x-real-ip": "10.0.0.1",
  });
  assert.equal(clientIp(headers), "198.51.100.7", "the proxy-appended (right-most) hop wins");
});

test("clientIp does not trust a bare x-real-ip header from an untrusted caller", () => {
  assert.equal(clientIp(headersOf({ "x-real-ip": "10.0.0.1" })), "unknown");
});

test("clientIp trusts x-vercel-forwarded-for only on Vercel", () => {
  const previous = process.env.VERCEL;

  delete process.env.VERCEL;
  assert.equal(clientIp(headersOf({ "x-vercel-forwarded-for": "203.0.113.5" })), "unknown");

  process.env.VERCEL = "1";
  try {
    assert.equal(clientIp(headersOf({ "x-vercel-forwarded-for": "203.0.113.5" })), "203.0.113.5");
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test("clientIp honours an explicitly configured trusted proxy header", () => {
  const previous = process.env.TRUSTED_IP_HEADER;
  process.env.TRUSTED_IP_HEADER = "cf-connecting-ip";
  try {
    assert.equal(clientIp(headersOf({ "cf-connecting-ip": "203.0.113.42" })), "203.0.113.42");
  } finally {
    if (previous === undefined) delete process.env.TRUSTED_IP_HEADER;
    else process.env.TRUSTED_IP_HEADER = previous;
  }
});

test("hashedKey is deterministic, scoped and does not retain the raw value", () => {
  const a = hashedKey("checkout-phone", "+201012345678");
  const b = hashedKey("checkout-phone", "+201012345678");
  const c = hashedKey("login-account", "+201012345678");

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(!a.includes("201012345678"));
  assert.match(a, /^checkout-phone:[0-9a-f]{32}$/);
});
