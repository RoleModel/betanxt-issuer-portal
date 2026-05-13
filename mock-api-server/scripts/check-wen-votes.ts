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

  const props = await client.query(
    "SELECT proposal_number, proposal_type FROM proposal WHERE meeting_id = 'wen-annual-meeting-2026' ORDER BY proposal_number"
  )
  console.log('Proposals:')
  for (const row of props.rows) {
    console.log(`  ${String(row.proposal_number).padEnd(6)} | ${row.proposal_type}`)
  }

  const pvs = await client.query(
    "SELECT pos.name, pr.proposal_number, pv.vote FROM position_vote pv JOIN position pos ON pos.id = pv.position_id JOIN proposal pr ON pr.id = pv.proposal_id WHERE pos.meeting_id = 'wen-annual-meeting-2026' ORDER BY pos.name, pr.proposal_number"
  )
  console.log('\nPosition votes:')
  for (const row of pvs.rows) {
    console.log(
      `  ${String(row.name).padEnd(30)} | ${String(row.proposal_number).padEnd(6)} | ${row.vote}`
    )
  }

  await client.end()
}

void run()
// Add meeting shares check
