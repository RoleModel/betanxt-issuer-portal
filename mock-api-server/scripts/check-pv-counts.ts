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

  const r = await client.query(`
    SELECT pr.proposal_number, COUNT(*) AS row_count,
           SUM(pv.shares_voting::numeric) AS total_shares,
           STRING_AGG(pv.vote, ',' ORDER BY pv.vote) AS votes
    FROM position_vote pv
    JOIN proposal pr ON pr.id = pv.proposal_id
    WHERE pr.meeting_id = 'wen-annual-meeting-2026'
    GROUP BY pr.id, pr.proposal_number
    ORDER BY pr.proposal_number
  `)
  for (const row of r.rows) {
    console.log(`${Number(row.proposal_number).toFixed(2).padEnd(6)} | rows=${row.row_count} | total=${Number(row.total_shares).toLocaleString().padStart(12)} | ${row.votes}`)
  }

  const total = await client.query(`
    SELECT COUNT(*) FROM position_vote pv
    JOIN position pos ON pos.id = pv.position_id
    WHERE pos.meeting_id = 'wen-annual-meeting-2026'
  `)
  console.log(`\nTotal via position join: ${total.rows[0].count}`)

  const total2 = await client.query(`
    SELECT COUNT(*) FROM position_vote pv
    JOIN proposal pr ON pr.id = pv.proposal_id
    WHERE pr.meeting_id = 'wen-annual-meeting-2026'
  `)
  console.log(`Total via proposal join: ${total2.rows[0].count}`)

  await client.end()
}

void run()
