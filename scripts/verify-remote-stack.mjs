#!/usr/bin/env node
/**
 * Smoke-check production API + Supabase alignment for past meetings.
 * Usage: node scripts/verify-remote-stack.mjs
 */

const API_BASE = process.env.API_BASE_URL ?? "https://bn-mock-api-server.vercel.app/api";
const TICKER = process.env.VERIFY_TICKER ?? "FOC";

async function fetchJson(path) {
  const url = `${API_BASE.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${url}: ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

async function main() {
  const complete = await fetchJson("/meetings?status=COMPLETE");
  const completeCount = Array.isArray(complete.meetings) ? complete.meetings.length : 0;

  const byTicker = await fetchJson(
    `/meetings?ticker=${encodeURIComponent(TICKER)}&status=COMPLETE`,
  );
  const tickerCount = Array.isArray(byTicker.meetings) ? byTicker.meetings.length : 0;

  console.log(`API: ${API_BASE}`);
  console.log(`COMPLETE meetings (all tickers): ${completeCount}`);
  console.log(`COMPLETE meetings (${TICKER}): ${tickerCount}`);

  if (completeCount < 100) {
    console.error("FAIL: expected hundreds of COMPLETE meetings after seed:remote");
    process.exit(1);
  }

  if (tickerCount < 4) {
    console.error(`FAIL: expected at least 4 past meetings for ${TICKER}`);
    process.exit(1);
  }

  console.log("OK: remote API returns past meeting data");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
