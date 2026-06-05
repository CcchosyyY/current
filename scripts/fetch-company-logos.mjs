#!/usr/bin/env node
// Download brand logos for every company in src/lib/companies.ts.
//
//   Source 1: DuckDuckGo icons   https://icons.duckduckgo.com/ip3/<domain>.ico
//   Source 2: Google favicons    https://www.google.com/s2/favicons?domain=<domain>&sz=128  (fallback)
//
// Saves to public/icons/companies/<slug>.<ext> and writes a slug→filename map
// to src/lib/company-logos.json (so the UI knows the real extension).
//
// Usage:  node scripts/fetch-company-logos.mjs [--force]
//   --force  re-download even if a logo file already exists.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "icons", "companies");
const MAP_FILE = join(ROOT, "src", "lib", "company-logos.json");
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 8;
const MIN_BYTES = 70; // smaller than this is almost certainly a blank/1x1 placeholder

const EXT_BY_TYPE = {
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function parseCompanies() {
  const src = readFileSync(join(ROOT, "src", "lib", "companies.ts"), "utf8");
  const re = /\{\s*slug:\s*"([^"]+)",\s*name:\s*"[^"]*",\s*domain:\s*"([^"]+)"/g;
  const rows = [];
  let m;
  while ((m = re.exec(src))) rows.push({ slug: m[1], domain: m[2] });
  return rows;
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (logo-fetcher)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) return null; // not an image
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) return null; // blank placeholder
    return { buf, ext };
  } catch {
    return null;
  }
}

async function fetchLogo(domain) {
  // 1) DuckDuckGo
  let r = await tryFetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  if (r) return { ...r, source: "duckduckgo" };
  // 2) Google favicons
  r = await tryFetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  if (r) return { ...r, source: "google" };
  return null;
}

function existingFileFor(slug) {
  if (!existsSync(OUT_DIR)) return null;
  const hit = readdirSync(OUT_DIR).find((f) => f.replace(/\.[^.]+$/, "") === slug);
  return hit || null;
}

async function run() {
  const companies = parseCompanies();
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Fetching logos for ${companies.length} companies → ${OUT_DIR}\n`);

  const map = {};
  const stats = { duckduckgo: 0, google: 0, skipped: 0, failed: [] };

  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ slug, domain }) => {
        if (!FORCE) {
          const existing = existingFileFor(slug);
          if (existing) {
            map[slug] = existing;
            stats.skipped++;
            return;
          }
        }
        const logo = await fetchLogo(domain);
        if (!logo) {
          stats.failed.push(`${slug} (${domain})`);
          return;
        }
        const filename = `${slug}.${logo.ext}`;
        writeFileSync(join(OUT_DIR, filename), logo.buf);
        map[slug] = filename;
        stats[logo.source]++;
        process.stdout.write(`  ✓ ${slug.padEnd(24)} ${logo.source}/${logo.ext} (${logo.buf.length}B)\n`);
      }),
    );
  }

  // Stable, sorted map for clean diffs
  const sorted = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  writeFileSync(MAP_FILE, JSON.stringify(sorted, null, 2) + "\n");

  console.log(`\n── Summary ──`);
  console.log(`  DuckDuckGo : ${stats.duckduckgo}`);
  console.log(`  Google     : ${stats.google}`);
  console.log(`  Skipped    : ${stats.skipped} (already present)`);
  console.log(`  Resolved   : ${Object.keys(map).length}/${companies.length}`);
  console.log(`  Failed     : ${stats.failed.length}`);
  if (stats.failed.length) console.log(`    ${stats.failed.join("\n    ")}`);
  console.log(`\nMap written → ${MAP_FILE}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
