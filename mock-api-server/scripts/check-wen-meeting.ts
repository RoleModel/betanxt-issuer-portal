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

  const r = await client.query(
    "SELECT id, title, total_shares_outstanding, quorum_requirement, meeting_date FROM meeting WHERE id = 'wen-annual-meeting-2026'"
  );
  console.log("Meeting:");
  for (const row of r.rows) {
    console.log(JSON.stringify(row, null, 2));
  }

  const p = await client.query(
    "SELECT proposal_number, proposal_type, total_votes_for, total_votes_against, total_votes_abstain, total_shares_eligible, for_percentage, against_percentage, abstain_percentage FROM proposal WHERE meeting_id = 'wen-annual-meeting-2026' ORDER BY proposal_number"
  );
  console.log("\nProposal totals:");
  for (const row of p.rows) {
    console.log(
      `  ${row.proposal_number} | FOR=${row.total_votes_for} AGAINST=${row.total_votes_against} ABSTAIN=${row.total_votes_abstain} | eligible=${row.total_shares_eligible}`
    );
  }

  await client.end();
}

void run();
