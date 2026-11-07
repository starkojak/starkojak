// Verifies the contract address in content.js, that the StarkLaunchy link points at the
// same token, that the Avnu and X links are exactly the ones in use, that index.html holds
// exactly what tools/prerender.mjs writes from content.js (so the page reads the same without
// JavaScript), and that no other site file carries a copy of the address.
// Usage: node tools/check-ca.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { readContent, render } from "./prerender.mjs";

const EXPECTED = "0x01576Eb581192ad3b05C27836C4b324D89c6814Cc3Ab44F476507D58e6f77c45";
const EXPECTED_AVNU = "https://app.avnu.fi/en?sellToken=strk&buyToken=starkojak";
const EXPECTED_X = "https://x.com/Starkojak";
const src = readFileSync("content.js", "utf8");
const m = src.match(/const STARKOJAK_CA = "([^"]*)";/);
const ca = m && m[1];
let ok = ca === EXPECTED && ca.length === 66;
console.log(`content.js CA: ${ca}`);
console.log(`length: ${ca && ca.length} (expected 66), exact match: ${ca === EXPECTED}`);

// Compare addresses without 0x, leading zeros or case.
const norm = (a) => a.replace(/^0x/i, "").replace(/^0+/, "").toLowerCase();
const u = src.match(/const STARKLAUNCHY_URL = "([^"]*)";/);
const url = u && u[1];
const t = url && url.match(/^https:\/\/starklaunchy\.fun\/token\/(0x[0-9a-fA-F]+)\?side=buy$/);
const urlCa = t && t[1];
const urlOk = !!(urlCa && ca && norm(urlCa) === norm(ca));
if (!urlOk) ok = false;
console.log(`StarkLaunchy URL: ${url}`);
console.log(`StarkLaunchy token: ${urlCa}, matches CA: ${urlOk}`);

const a = src.match(/const AVNU_URL = "([^"]*)";/);
const avnuOk = !!(a && a[1] === EXPECTED_AVNU);
if (!avnuOk) ok = false;
console.log(`Avnu URL: ${a && a[1]}, exact match: ${avnuOk}`);
const x = src.match(/const X_URL = "([^"]*)";/);
const xOk = !!(x && x[1] === EXPECTED_X);
if (!xOk) ok = false;
console.log(`X URL: ${x && x[1]}, exact match: ${xOk}`);

// index.html carries the copies tools/prerender.mjs writes from content.js. They must be exactly
// what content.js holds now: re-rendering index.html must not change a byte.
const html = readFileSync("index.html", "utf8");
let rendered = null;
try { rendered = render(html, readContent(src)).html; } catch (e) { console.log(`prerender failed: ${e.message}`); }
const inSync = rendered === html;
if (!inSync) ok = false;
console.log(`index.html copy written from content.js and up to date: ${inSync}${inSync ? "" : " (run node tools/prerender.mjs)"}`);

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  if (f.startsWith(".") || f === "assets" || f === "tools" || f === "node_modules" || f === "_redesign") return [];
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const f of walk(".").filter((f) => /\.(html|js|css|json)$/.test(f))) {
  for (const hit of readFileSync(f, "utf8").match(/0x[0-9a-fA-F]{20,}/g) || []) {
    if (f === "content.js") continue;
    // in index.html only the address itself and the StarkLaunchy token, byte for byte as in content.js
    if (f === "index.html" && (hit === ca || hit === urlCa)) continue;
    ok = false; console.log(`stray address in ${f}: ${hit}`);
  }
}
const inHtml = html.match(/0x[0-9a-fA-F]{20,}/g) || [];
console.log(`index.html: address ${inHtml.filter((h) => h === ca).length}x, StarkLaunchy token ${inHtml.filter((h) => h === urlCa).length}x`);
// content.js may hold the CA once and the StarkLaunchy URL once, nothing else.
const inContent = src.match(/0x[0-9a-fA-F]{20,}/g) || [];
if (inContent.length !== 2 || !inContent.includes(ca) || !inContent.includes(urlCa)) {
  ok = false;
  console.log(`unexpected addresses in content.js: ${inContent.join(", ")}`);
}
console.log(ok ? "OK" : "FAIL");
process.exit(ok ? 0 : 1);
