#!/usr/bin/env node
// 아직 번역되지 않은 기사(translated_at IS NULL)를 한국어로 번역해 채운다.
//   node scripts/translate-articles.mjs              # 전부 (최신 기사부터)
//   node scripts/translate-articles.mjs --limit=20   # 일부만 (품질 확인용)
//   node scripts/translate-articles.mjs --dry        # 번역만 출력, DB 저장 안 함
//   node scripts/translate-articles.mjs --all        # 이미 번역된 것까지 다시 (규칙을 바꿨을 때)

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { translateBatch, costUsd, TRANSLATE_MODEL } from "./lib/translate.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fileEnv = (() => {
  try {
    const out = {};
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      out[t.slice(0, t.indexOf("=")).trim()] = t.slice(t.indexOf("=") + 1).trim();
    }
    return out;
  } catch {
    return {};
  }
})();
const env = (k) => process.env[k] || fileEnv[k] || "";
const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const KEY = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8) || 0);
const DRY = process.argv.includes("--dry");
const ALL = process.argv.includes("--all"); // 이미 번역된 것까지 다시 (번역 규칙을 바꿨을 때)
const BATCH = 6; // 기사 6개씩 한 번에
const PARALLEL = 4; // 동시에 4번

if (!SUPABASE_URL || !KEY || !env("ANTHROPIC_API_KEY")) throw new Error("SUPABASE + ANTHROPIC_API_KEY required");

const sb = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });

const { default: Anthropic } = await import("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY"), maxRetries: 4 });

const pending = await (
  await sb(
    `articles?select=id,title,summary,content${ALL ? "" : "&translated_at=is.null"}&order=published_at.desc.nullslast${LIMIT ? `&limit=${LIMIT}` : "&limit=5000"}`,
  )
).json();
console.log(`Untranslated: ${pending.length} (model ${TRANSLATE_MODEL})`);

const batches = [];
for (let i = 0; i < pending.length; i += BATCH) batches.push(pending.slice(i, i + BATCH));

let done = 0, failed = 0, cost = 0, next = 0;
async function worker() {
  while (next < batches.length) {
    const batch = batches[next++];
    try {
      const { out, usage, stop } = await translateBatch(client, batch);
      cost += costUsd(usage);
      for (const [i, t] of out) {
        if (DRY) {
          console.log(`\n— ${batch[i].title}\n→ ${t.title_ko}\n  ${t.summary_ko}\n  [본문 ${t.content_ko.length}자] ${t.content_ko.slice(0, 160)}…`);
        } else {
          const r = await sb(`articles?id=eq.${batch[i].id}`, {
            method: "PATCH",
            body: JSON.stringify({ ...t, translated_at: new Date().toISOString() }),
          });
          if (!r.ok) throw new Error(`save ${r.status}`);
        }
        done++;
      }
      failed += batch.length - out.size;
      if (stop !== "end_turn") console.log(`  batch stop=${stop}`);
    } catch (e) {
      failed += batch.length;
      console.error("  batch failed:", e.message);
    }
    if (!DRY) process.stdout.write(`\r  ${done}/${pending.length} translated, ${failed} failed, ~$${cost.toFixed(3)}   `);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`\nDone: ${done} translated, ${failed} failed, cost ~$${cost.toFixed(3)}${DRY ? " (dry)" : ""}`);
