#!/usr/bin/env tsx
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

async function run() {
  const client = new pg.Client({
    host: "aws-1-us-east-2.pooler.supabase.com",
    port: 5432,
    user: "postgres.vfgjzlcakdrpsbzuqklz",
    password: process.env.POSTGRES_PASSWORD ?? "ZgnAkgxVLYDcf9gj",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("=== WEN 2026 Remote DB Verification ===\n");

  const proposals = await client.query(`
    SELECT ROUND(proposal_number::numeric,2) AS num, proposal_type,
           total_votes_for, total_votes_against, total_votes_abstain,
           total_shares_eligible
    FROM proposal WHERE meeting_id = 'wen-annual-meeting-2026' ORDER BY proposal_number
  `);
  console.log("Proposal totals:");
  for (const r of proposals.rows) {
    const total =
      Number(r.total_votes_for) + Number(r.total_votes_against) + Number(r.total_votes_abstain);
    const pct = total > 0 ? ((Number(r.total_votes_for) / total) * 100).toFixed(1) : "0.0";
    console.log(
      `  ${String(r.num).padEnd(6)} ${r.proposal_type.padEnd(22)} FOR=${Number(r.total_votes_for).toLocaleString().padStart(10)}  AGN=${Number(r.total_votes_against).toLocaleString().padStart(9)}  ABS=${Number(r.total_votes_abstain).toLocaleString().padStart(8)}  %FOR=${pct}%  eligible=${Number(r.total_shares_eligible).toLocaleString()}`,
    );
  }

  const pv = await client.query(`
    SELECT COUNT(*) AS cnt FROM position_vote pv
    JOIN proposal pr ON pr.id = pv.proposal_id
    WHERE pr.meeting_id = 'wen-annual-meeting-2026'
  `);
  console.log(`\nTotal position_vote records: ${pv.rows[0].cnt}`);

  const tab = await client.query(`
    SELECT positions_voted FROM tabulation_report WHERE meeting_id = 'wen-annual-meeting-2026'
  `);
  console.log(`Tabulation report: ${JSON.stringify(tab.rows[0].positions_voted)}`);

  await client.end();
}

void run();
