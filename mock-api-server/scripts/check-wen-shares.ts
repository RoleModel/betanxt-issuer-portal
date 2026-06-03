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

  const r = await client.query(`
    SELECT pos.name, pr.proposal_number, pv.vote, pv.shares_voting
    FROM position_vote pv
    JOIN position pos ON pos.id = pv.position_id
    JOIN proposal pr ON pr.id = pv.proposal_id
    WHERE pos.meeting_id = 'wen-annual-meeting-2026'
      AND pr.proposal_number IN (1.07, 1.08)
    ORDER BY pr.proposal_number, pos.name
  `);
  for (const row of r.rows) {
    console.log(
      `${row.name.padEnd(30)} | ${Number(row.proposal_number).toFixed(2)} | ${row.vote.padEnd(8)} | shares_voting="${row.shares_voting}"`,
    );
  }

  await client.end();
}

void run();
