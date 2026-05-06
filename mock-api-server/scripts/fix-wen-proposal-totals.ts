#!/usr/bin/env tsx
/**
 * Recalculates and corrects WEN 2026 proposal totals from position_vote records.
 */
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

async function run() {
  const client = new pg.Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.vfgjzlcakdrpsbzuqklz',
    password: process.env.POSTGRES_PASSWORD ?? 'ZgnAkgxVLYDcf9gj',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log('✅ Connected')

  try {
    await client.query('BEGIN')

    const proposals = await client.query(
      `SELECT id, proposal_number FROM proposal
       WHERE meeting_id = 'wen-annual-meeting-2026'
       ORDER BY proposal_number`
    )

    const totalShares = 190466246

    for (const p of proposals.rows) {
      const totals = await client.query(
        `SELECT
           SUM(CASE WHEN vote = 'FOR'     THEN shares_voting::numeric ELSE 0 END) AS total_for,
           SUM(CASE WHEN vote = 'AGAINST' THEN shares_voting::numeric ELSE 0 END) AS total_against,
           SUM(CASE WHEN vote = 'ABSTAIN' THEN shares_voting::numeric ELSE 0 END) AS total_abstain
         FROM position_vote WHERE proposal_id = $1`,
        [p.id]
      )
      const t = totals.rows[0]
      const totalFor = Number(t.total_for)
      const totalAgainst = Number(t.total_against)
      const totalAbstain = Number(t.total_abstain)

      await client.query(
        `UPDATE proposal SET
           total_votes_for     = $1,
           total_votes_against = $2,
           total_votes_abstain = $3,
           total_shares_eligible = $4,
           for_percentage      = $5,
           against_percentage  = $6,
           abstain_percentage  = $7,
           participation_rate  = $8,
           updated_at          = NOW()
         WHERE id = $9`,
        [
          totalFor, totalAgainst, totalAbstain, totalShares,
          ((totalFor / totalShares) * 100).toFixed(4),
          ((totalAgainst / totalShares) * 100).toFixed(4),
          ((totalAbstain / totalShares) * 100).toFixed(4),
          (((totalFor + totalAgainst + totalAbstain) / totalShares) * 100).toFixed(4),
          p.id,
        ]
      )
      console.log(
        `  ${Number(p.proposal_number).toFixed(2).padEnd(6)} → FOR=${totalFor.toLocaleString().padStart(10)}  AGAINST=${totalAgainst.toLocaleString().padStart(10)}  ABSTAIN=${totalAbstain.toLocaleString().padStart(8)}`
      )
    }

    await client.query('COMMIT')
    console.log('\n🎉 Proposal totals corrected.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

void run()
