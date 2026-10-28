#!/usr/bin/env node
/**
 * Bounded HTTP load test for the REEVITA storefront.
 *
 * Usage:
 *   node scripts/load-test.mjs --base-url http://127.0.0.1:3200 \
 *     --levels 5,10,25,50 --requests-per-user 4 [--warmup 10] [--json out.json]
 *
 * Design notes
 *   - Only read-only storefront routes are exercised. Checkout is included as a
 *     page render (GET) and never as an order submission, so the script cannot
 *     create real COD orders.
 *   - Each level runs a fixed number of requests per virtual user (bounded total
 *     requests), so the test is finite and safe to run on shared hardware.
 *   - The tool refuses to run against anything that is not localhost/127.0.0.1
 *     unless --allow-remote is passed explicitly.
 */
import { writeFile } from "node:fs/promises";

const MIX = [
  { path: "/", weight: 4, name: "home" },
  { path: "/shop", weight: 3, name: "shop" },
  { path: "/shop?category=body-lotion&sort=price-asc", weight: 2, name: "shop-filter" },
  { path: "/products/body-lotion-queen", weight: 3, name: "product" },
  { path: "/collections/sexy", weight: 1, name: "collection" },
  { path: "/checkout", weight: 2, name: "checkout-page" },
  { path: "/track", weight: 1, name: "track-page" },
  { path: "/sitemap.xml", weight: 1, name: "sitemap" },
];

const DEFAULTS = {
  baseUrl: "http://127.0.0.1:3200",
  levels: [5, 10, 25, 50],
  requestsPerUser: 4,
  warmup: 10,
  timeoutMs: 15_000,
  json: "",
  allowRemote: false,
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    switch (arg) {
      case "--base-url":
        options.baseUrl = next();
        break;
      case "--levels":
        options.levels = next()
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => value > 0);
        break;
      case "--requests-per-user":
        options.requestsPerUser = Number(next());
        break;
      case "--warmup":
        options.warmup = Number(next());
        break;
      case "--timeout":
        options.timeoutMs = Number(next());
        break;
      case "--json":
        options.json = next();
        break;
      case "--allow-remote":
        options.allowRemote = true;
        break;
      case "--help":
        console.log("See the header of scripts/load-test.mjs for usage.");
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }
  return options;
}

function isLocal(url) {
  const host = new URL(url).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

const weightedMix = MIX.flatMap((entry) => Array.from({ length: entry.weight }, () => entry));

function pickEndpoint(seed) {
  return weightedMix[seed % weightedMix.length];
}

function percentile(sorted, value) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((value / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(rank, 0), sorted.length - 1)];
}

async function timedFetch(url, timeoutMs) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { "user-agent": "reevita-load-test/1.0" },
    });
    // Consume the body so connections can be reused.
    await response.arrayBuffer();
    return { ms: performance.now() - startedAt, status: response.status, error: null };
  } catch (error) {
    return { ms: performance.now() - startedAt, status: 0, error: error.name || "Error" };
  } finally {
    clearTimeout(timer);
  }
}


async function runLevel({ baseUrl, concurrency, totalRequests, timeoutMs }) {
  const samples = [];
  const statuses = new Map();
  const errors = new Map();
  const perEndpoint = new Map();
  let cursor = 0;

  async function worker(workerId) {
    for (;;) {
      const index = cursor++;
      if (index >= totalRequests) return;
      const endpoint = pickEndpoint(index + workerId);
      const result = await timedFetch(`${baseUrl}${endpoint.path}`, timeoutMs);
      samples.push(result.ms);
      perEndpoint.set(endpoint.name, (perEndpoint.get(endpoint.name) ?? 0) + 1);
      if (result.error) {
        errors.set(result.error, (errors.get(result.error) ?? 0) + 1);
      } else {
        statuses.set(result.status, (statuses.get(result.status) ?? 0) + 1);
      }
    }
  }

  const startedAt = performance.now();
  await Promise.all(Array.from({ length: concurrency }, (_, id) => worker(id)));
  const wallMs = performance.now() - startedAt;

  const sorted = [...samples].sort((a, b) => a - b);
  const failures = [...errors.values()].reduce((sum, value) => sum + value, 0);
  const non2xx = [...statuses.entries()]
    .filter(([status]) => status < 200 || status >= 300)
    .reduce((sum, [, count]) => sum + count, 0);

  return {
    concurrency,
    totalRequests,
    wallMs: Math.round(wallMs),
    throughputRps: Number(((totalRequests / wallMs) * 1000).toFixed(2)),
    latencyMs: {
      min: Number((sorted[0] ?? 0).toFixed(2)),
      median: Number(percentile(sorted, 50).toFixed(2)),
      p95: Number(percentile(sorted, 95).toFixed(2)),
      p99: Number(percentile(sorted, 99).toFixed(2)),
      max: Number((sorted.at(-1) ?? 0).toFixed(2)),
    },
    statusDistribution: Object.fromEntries([...statuses.entries()].sort()),
    errors: Object.fromEntries(errors),
    errorRate: Number((((failures + non2xx) / totalRequests) * 100).toFixed(2)),
    endpointDistribution: Object.fromEntries(perEndpoint),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!isLocal(options.baseUrl) && !options.allowRemote) {
    console.error("Refusing to load-test a non-local target without --allow-remote.");
    process.exit(1);
  }

  console.log(`Target: ${options.baseUrl}`);
  console.log(`Levels: ${options.levels.join(", ")} concurrent users · ${options.requestsPerUser} requests/user`);

  // Warm-up (rendering is cold right after boot).
  for (let index = 0; index < options.warmup; index += 1) {
    await timedFetch(`${options.baseUrl}/`, options.timeoutMs);
  }

  const results = [];
  for (const concurrency of options.levels) {
    const result = await runLevel({
      baseUrl: options.baseUrl,
      concurrency,
      totalRequests: concurrency * options.requestsPerUser,
      timeoutMs: options.timeoutMs,
    });
    results.push(result);
    console.log(
      `${String(concurrency).padStart(3)} users · ${result.throughputRps} rps · median ${result.latencyMs.median} ms · ` +
        `p95 ${result.latencyMs.p95} ms · p99 ${result.latencyMs.p99} ms · errors ${result.errorRate}%`,
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    target: options.baseUrl,
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    requestsPerUser: options.requestsPerUser,
    results,
  };

  if (options.json) {
    await writeFile(options.json, JSON.stringify(report, null, 2), "utf8");
    console.log(`JSON written to ${options.json}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
