// Writes every piece of copy from content.js into index.html, so the page reads without JavaScript.
// content.js stays the only place to edit the text, the links and the contract address. After editing it:
//   node tools/prerender.mjs           rewrites index.html
//   node tools/prerender.mjs --check   exits 1 if index.html is out of date (tools/check-ca.mjs runs this too)
// With JavaScript on, the inline script at the end of index.html fills the same values from content.js
// again, so the page looks the same either way.
//
// What it fills, exactly as that inline script does:
//   data-c="path"       the element's text        data-c-alt="path"   the alt attribute
//   data-c-aria="path"  the aria-label attribute  data-href="avnu|launchy|x"  the href attribute
//   data-ca             the element's text (the contract address)
// Only Node built-ins. Elements that get text must hold nothing but text.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

export function readContent(src) {
  const box = { window: {} };
  vm.createContext(box);
  vm.runInContext(`${src}\n;window.__links = { ca: STARKOJAK_CA, avnu: AVNU_URL, launchy: STARKLAUNCHY_URL, x: X_URL };`, box);
  return { copy: box.window.STARK_COPY, ...box.window.__links };
}

const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => escText(s).replace(/"/g, "&quot;");

export function render(html, content) {
  const text = (path) => {
    const v = path.split(".").reduce((o, k) => (o == null ? o : o[k]), content.copy);
    if (typeof v !== "string" || !v) throw new Error(`content.js has no text for "${path}"`);
    return v;
  };
  const links = { avnu: content.avnu, launchy: content.launchy, x: content.x };
  const counts = { "data-c": 0, "data-c-alt": 0, "data-c-aria": 0, "data-href": 0, "data-ca": 0 };

  // set name="value" in a start tag's attribute text: replace the value if the attribute is there,
  // otherwise insert it right after the data attribute that drives it (keeps the hand formatting)
  const upsert = (attrs, name, value, anchor) => {
    const has = new RegExp(`(\\s${name}=")[^"]*(")`);
    if (has.test(attrs)) return attrs.replace(has, (_, a, b) => a + escAttr(value) + b);
    const at = new RegExp(`(\\s${anchor}="[^"]*")`);
    if (!at.test(attrs)) throw new Error(`cannot place ${name} next to ${anchor} in <…${attrs}>`);
    return attrs.replace(at, (m) => `${m} ${name}="${escAttr(value)}"`);
  };
  const attr = (attrs, name) => { const m = attrs.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };

  let out = "";
  let pos = 0;
  const tag = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>|<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*?)?>/g;
  let m;
  while ((m = tag.exec(html))) {
    const name = m[2];
    let attrs = m[3] || "";
    if (!name || !/\sdata-(c|c-alt|c-aria|href)="|\sdata-ca(?=[\s/>]|$)/.test(attrs)) continue;   // comments, scripts, other tags
    const c = attr(attrs, "data-c");
    const alt = attr(attrs, "data-c-alt");
    const aria = attr(attrs, "data-c-aria");
    const href = attr(attrs, "data-href");
    const isCa = /\sdata-ca(?=[\s/>]|$)/.test(attrs);
    if (alt !== null) { attrs = upsert(attrs, "alt", text(alt), "data-c-alt"); counts["data-c-alt"]++; }
    if (aria !== null) { attrs = upsert(attrs, "aria-label", text(aria), "data-c-aria"); counts["data-c-aria"]++; }
    if (href !== null) {
      if (!links[href]) throw new Error(`unknown data-href="${href}"`);
      attrs = upsert(attrs, "href", links[href], "data-href"); counts["data-href"]++;
    }
    out += html.slice(pos, m.index) + `<${name}${attrs}>`;
    pos = m.index + m[0].length;
    if (c !== null || isCa) {
      const close = html.indexOf(`</${name}>`, pos);
      if (close < 0) throw new Error(`no </${name}> after data-c="${c}"`);
      if (html.slice(pos, close).includes("<")) throw new Error(`<${name} data-c="${c}"> must hold only text`);
      out += escText(isCa ? content.ca : text(c));
      counts[isCa ? "data-ca" : "data-c"]++;
      pos = close;
      tag.lastIndex = close;
    }
  }
  return { html: out + html.slice(pos), counts };
}

// run from the command line (not when imported by check-ca.mjs)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const file = join(root, "index.html");
  const before = readFileSync(file, "utf8");
  const { html, counts } = render(before, readContent(readFileSync(join(root, "content.js"), "utf8")));
  const summary = Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ");
  if (process.argv.includes("--check")) {
    if (html === before) { console.log(`index.html is up to date with content.js (${summary})`); process.exit(0); }
    const a = before.split("\n"), b = html.split("\n");
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) console.log(`line ${i + 1}:\n  now:      ${a[i]}\n  expected: ${b[i]}`);
    console.log("index.html is OUT OF DATE: run node tools/prerender.mjs");
    process.exit(1);
  }
  if (html === before) console.log(`index.html already up to date (${summary})`);
  else { writeFileSync(file, html); console.log(`index.html written from content.js (${summary})`); }
}
