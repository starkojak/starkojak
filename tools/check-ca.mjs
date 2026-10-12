// Verifies the contract address in content.js and that no other site file carries a copy.
// Usage: node tools/check-ca.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const EXPECTED = "0x01576Eb581192ad3b05C27836C4b324D89c6814Cc3Ab44F476507D58e6f77c45";
const src = readFileSync("content.js", "utf8");
const m = src.match(/const STARKOJAK_CA = "([^"]*)";/);
const ca = m && m[1];
let ok = ca === EXPECTED && ca.length === 66;
console.log(`content.js CA: ${ca}`);
console.log(`length: ${ca && ca.length} (expected 66), exact match: ${ca === EXPECTED}`);

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  if (f.startsWith(".") || f === "assets" || f === "tools" || f === "node_modules") return [];
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const f of walk(".").filter((f) => /\.(html|js|css|json)$/.test(f))) {
  for (const hit of readFileSync(f, "utf8").match(/0x[0-9a-fA-F]{20,}/g) || []) {
    if (f !== "content.js") { ok = false; console.log(`stray address in ${f}: ${hit}`); }
  }
}
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);
