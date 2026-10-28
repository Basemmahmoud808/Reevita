#!/usr/bin/env node
/**
 * HTTP security smoke check for a running REEVITA deployment.
 *
 * Usage: node scripts/http-security-check.mjs --base-url http://127.0.0.1:3200
 *
 * Verifies observable controls: security headers, CSP nonce, unauthenticated
 * access to admin/account routes, 404 handling, absence of stack traces, and
 * that every sitemap URL resolves (no dead public routes). Exits non-zero on
 * failure so it can gate a deployment.
 */
const baseUrl = (() => {
  const index = process.argv.indexOf("--base-url");
  return (index > -1 ? process.argv[index + 1] : "http://127.0.0.1:3200").replace(/\/$/, "");
})();

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function get(path, init) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...init });
  const body = await response.text();
  return { response, body, headers: response.headers };
}

const requiredHeaders = [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["cross-origin-opener-policy", "same-origin"],
];

async function main() {
  const home = await get("/");
  check("homepage returns 200", home.response.status === 200, String(home.response.status));

  for (const [header, expected] of requiredHeaders) {
    check(`header ${header}`, home.headers.get(header) === expected, String(home.headers.get(header)));
  }

  const csp = home.headers.get("content-security-policy") ?? "";
  check("CSP present", csp.length > 0);
  check("CSP uses a per-response nonce", /'nonce-[A-Za-z0-9+/=]+'/.test(csp));
  check("CSP blocks framing", csp.includes("frame-ancestors 'none'"));
  check("CSP blocks objects", csp.includes("object-src 'none'"));
  check("CSP forbids eval in this build", !csp.includes("'unsafe-eval'"));

  const nonce = home.headers.get("x-nonce");
  check("nonce header matches CSP", Boolean(nonce) && csp.includes(`'nonce-${nonce}'`));

  for (const path of ["/admin", "/admin/orders", "/admin/products", "/account"]) {
    const { response } = await get(path);
    check(`${path} redirects unauthenticated visitors`, response.status === 307 || response.status === 302, String(response.status));
    const location = response.headers.get("location") ?? "";
    check(`${path} redirects to a login page`, /\/login/.test(location), location);
  }

  const unknown = await get("/this-route-does-not-exist");
  check("unknown route returns 404", unknown.response.status === 404, String(unknown.response.status));
  check(
    "error page does not leak stack traces",
    !/at\s+\w+\s+\(.*:\d+:\d+\)/.test(unknown.body) && !unknown.body.includes("node_modules"),
  );

  const sitemap = await get("/sitemap.xml");
  const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  check("sitemap lists public routes", urls.length > 0, `${urls.length} urls`);
  const dead = [];
  for (const url of urls) {
    const path = new URL(url).pathname + new URL(url).search;
    const { response } = await get(path);
    if (response.status >= 400) dead.push(`${path} → ${response.status}`);
  }
  check("every sitemap route resolves", dead.length === 0, dead.join(", "));

  const robots = await get("/robots.txt");
  check("robots.txt references the sitemap", robots.body.toLowerCase().includes("sitemap"));

  const image = await get("/images/supplied/Gemini_Generated_Image_ozjt9ozjt9ozjt9o.jfif");
  check(
    "static images are cacheable",
    (image.headers.get("cache-control") ?? "").includes("max-age"),
    image.headers.get("cache-control") ?? "",
  );

  const adminLogin = await get("/admin/login");
  check(
    "admin login page is not indexable",
    /noindex/i.test(adminLogin.body) || /noindex/i.test(adminLogin.headers.get("x-robots-tag") ?? ""),
  );

  const failed = results.filter((result) => !result.passed);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
