#!/usr/bin/env tsx
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

  // Count position_votes per position per proposal
  const r = await client.query(`
    SELECT pos.name, pr.proposal_number, COUNT(*) AS cnt, SUM(pv.shares_voting::numeric) AS total_shares, STRING_AGG(pv.vote, ', ' ORDER BY pv.created_at) AS votes
    FROM position_vote pv
    JOIN position pos ON pos.id = pv.position_id
    JOIN proposal pr ON pr.id = pv.proposal_id
    WHERE pos.meeting_id = 'wen-annual-meeting-2026'
    GROUP BY pos.name, pr.proposal_number, pos.id, pr.id
    HAVING COUNT(*) > 1
    ORDER BY pos.name, pr.proposal_number
  `)
  console.log(`Duplicate position_vote records (${r.rows.length} combos):`)
  for (const row of r.rows) {
    console.log(
      `  ${row.name} | ${Number(row.proposal_number).toFixed(2)} | count=${row.cnt} | total=${Number(row.total_shares).toLocaleString()} | votes=[${row.votes}]`
    )
  }

  const total = await client.query(`
    SELECT COUNT(*) FROM position_vote pv
    JOIN position pos ON pos.id = pv.position_id
    WHERE pos.meeting_id = 'wen-annual-meeting-2026'
  `)
  console.log(`\nTotal position_vote records: ${total.rows[0].count}`)

  await client.end()
}

void run()
