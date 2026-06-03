#!/usr/bin/env tsx
/**
 * Adds realistic variation to WEN 2026 director election votes.
 * Institutional holders oppose specific directors based on governance concerns.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const MEETING_ID = "wen-annual-meeting-2026";

// Which positions vote AGAINST which directors (by proposal_number)
// Directors not listed below get unanimous FOR support
const DIRECTOR_OPPOSITION: Record<string, string[]> = {
  "1.02": ["TORUM CAPITAL LLC"],
  "1.03": ["SEAMUS DANIEL III"],
  "1.05": ["IUDICIT CAPITAL CORP", "TORUM CAPITAL LLC"],
  "1.07": ["T. ROWE PRICE"],
  "1.08": ["WELLINGTON MANAGEMENT", "T. ROWE PRICE"],
};

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

    const proposalsRes = await client.query(
      `SELECT id, proposal_number FROM proposal
       WHERE meeting_id = $1 AND proposal_type = 'Director Election'
       ORDER BY proposal_number`,
      [MEETING_ID],
    );

    const positionsRes = await client.query(
      `SELECT id, name, shares_voted FROM position
       WHERE meeting_id = $1 AND vote_status = 'Voted'`,
      [MEETING_ID],
    );
    const positionsByName = new Map<string, { id: string; shares_voted: string }>(
      positionsRes.rows.map((r: { id: string; name: string; shares_voted: string }) => [r.name, r]),
    );

    console.log(`\n📋 Processing ${proposalsRes.rows.length} director proposals...`);

    for (const proposal of proposalsRes.rows) {
      const propNum = Number(proposal.proposal_number).toFixed(2);
      const opposers = DIRECTOR_OPPOSITION[propNum] ?? [];

      if (opposers.length === 0) continue;

      console.log(`\n  Proposal ${propNum} — ${opposers.join(", ")} voting AGAINST:`);

      for (const posName of opposers) {
        const pos = positionsByName.get(posName);
        if (!pos) {
          console.warn(`    ⚠️  Position not found: ${posName}`);
          continue;
        }

        const updated = await client.query(
          `UPDATE position_vote
           SET vote = 'AGAINST'
           WHERE position_id = $1 AND proposal_id = $2`,
          [pos.id, proposal.id],
        );
        console.log(
          `    ✓ ${posName}: ${Number(pos.shares_voted).toLocaleString()} shares → AGAINST (${updated.rowCount} row)`,
        );
      }

      // Recalculate this proposal's totals from position_vote records
      const totalsRes = await client.query(
        `SELECT
           SUM(CASE WHEN vote = 'FOR'     THEN shares_voting::numeric ELSE 0 END) AS total_for,
           SUM(CASE WHEN vote = 'AGAINST' THEN shares_voting::numeric ELSE 0 END) AS total_against,
           SUM(CASE WHEN vote = 'ABSTAIN' THEN shares_voting::numeric ELSE 0 END) AS total_abstain
         FROM position_vote
         WHERE proposal_id = $1`,
        [proposal.id],
      );
      const t = totalsRes.rows[0];
      const totalFor = Number(t.total_for);
      const totalAgainst = Number(t.total_against);
      const totalAbstain = Number(t.total_abstain);
      const totalVotes = totalFor + totalAgainst + totalAbstain;
      const totalShares = 190466246;

      await client.query(
        `UPDATE proposal SET
           total_votes_for     = $1,
           total_votes_against = $2,
           total_votes_abstain = $3,
           for_percentage      = $4,
           against_percentage  = $5,
           abstain_percentage  = $6,
           participation_rate  = $7,
           updated_at          = NOW()
         WHERE id = $8`,
        [
          totalFor,
          totalAgainst,
          totalAbstain,
          ((totalFor / totalShares) * 100).toFixed(4),
          ((totalAgainst / totalShares) * 100).toFixed(4),
          ((totalAbstain / totalShares) * 100).toFixed(4),
          ((totalVotes / totalShares) * 100).toFixed(4),
          proposal.id,
        ],
      );
      console.log(
        `    → FOR=${totalFor.toLocaleString()} AGAINST=${totalAgainst.toLocaleString()} ABSTAIN=${totalAbstain.toLocaleString()}`,
      );
    }

    await client.query("COMMIT");
    console.log("\n🎉 Done — director vote variation applied.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error, rolled back:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void run();
