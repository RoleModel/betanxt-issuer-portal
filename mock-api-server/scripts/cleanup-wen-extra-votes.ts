#!/usr/bin/env tsx
/**
 * Removes spurious position_vote records for WEN 2026 proposals
 * that belong to unvoted positions. Keeps only the 6 intentionally voted positions.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const VOTED_NAMES = [
  "WELLINGTON MANAGEMENT",
  "T. ROWE PRICE",
  "BANK OF AMERICA CORP",
  "SEAMUS DANIEL III",
  "IUDICIT CAPITAL CORP",
  "TORUM CAPITAL LLC",
];

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
  console.log("✅ Connected");

  try {
    await client.query("BEGIN");

    // Delete position_vote records for WEN 2026 proposals that don't belong to our 6 voted positions
    const del = await client.query(
      `
      DELETE FROM position_vote
      WHERE proposal_id IN (
        SELECT id FROM proposal WHERE meeting_id = 'wen-annual-meeting-2026'
      )
      AND position_id NOT IN (
        SELECT id FROM position
        WHERE meeting_id = 'wen-annual-meeting-2026'
          AND name = ANY($1::text[])
      )
    `,
      [VOTED_NAMES]
    );
    console.log(`🗑️  Deleted ${del.rowCount} spurious position_vote records`);

    // Verify counts
    const counts = await client.query(`
      SELECT pr.proposal_number, COUNT(*) AS row_count,
             SUM(pv.shares_voting::numeric) AS total_shares
      FROM position_vote pv
      JOIN proposal pr ON pr.id = pv.proposal_id
      WHERE pr.meeting_id = 'wen-annual-meeting-2026'
      GROUP BY pr.id, pr.proposal_number
      ORDER BY pr.proposal_number
    `);
    console.log("\nPost-cleanup counts:");
    for (const row of counts.rows) {
      console.log(
        `  ${Number(row.proposal_number).toFixed(2).padEnd(6)} | rows=${row.row_count} | total=${Number(row.total_shares).toLocaleString()}`
      );
    }

    await client.query("COMMIT");
    console.log("\n🎉 Cleanup complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void run();
