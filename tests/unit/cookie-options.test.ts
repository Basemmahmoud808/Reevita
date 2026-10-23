import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const MODULE = path.resolve(process.cwd(), "src/lib/supabase/cookie-options.ts");

function readOptions(nodeEnv: string) {
  const script = `import(${JSON.stringify(MODULE)}).then((m) => console.log(JSON.stringify(m.authCookieOptions)))`;
  const output = execFileSync("npx", ["tsx", "-e", script], {
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: nodeEnv },
  });
  return JSON.parse(output.trim().split("\n").pop() as string);
}

test("auth cookies are httpOnly, lax and path-scoped in every environment", () => {
  for (const env of ["development", "production"]) {
    const options = readOptions(env);
    assert.equal(options.httpOnly, true, `httpOnly in ${env}`);
    assert.equal(options.sameSite, "lax", `sameSite in ${env}`);
    assert.equal(options.path, "/", `path in ${env}`);
    assert.equal(options.maxAge, 60 * 24 * 60 * 60, `maxAge in ${env}`);
  }
});

test("auth cookies set the Secure flag in production only", () => {
  assert.equal(readOptions("production").secure, true);
  assert.equal(readOptions("development").secure, false);
});
