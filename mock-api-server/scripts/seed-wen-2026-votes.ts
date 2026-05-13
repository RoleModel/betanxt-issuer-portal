#!/usr/bin/env tsx
/**
 * Seeds voted positions and position_vote records for WEN 2026 Annual Meeting.
 * Target: 5,624,687 shares voted (2.95% of 190,466,246 total)
 */
import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'ZgnAkgxVLYDcf9gj'

const MEETING_ID = 'wen-annual-meeting-2026'

// Positions to mark as voted — chosen to total exactly 5,624,687 shares
const VOTED_POSITIONS: {
  name: string
  sharesVoted: number
  source: 'WEB' | 'PRINT' | 'IVR'
  dateVoted: string
}[] = [
  {
    name: 'WELLINGTON MANAGEMENT',
    sharesVoted: 2052355,
    source: 'WEB',
    dateVoted: '04/30/2026 09:15AM',
  },
  {
    name: 'T. ROWE PRICE',
    sharesVoted: 1670944,
    source: 'WEB',
    dateVoted: '04/28/2026 10:42AM',
  },
  {
    name: 'BANK OF AMERICA CORP',
    sharesVoted: 1107909,
    source: 'WEB',
    dateVoted: '05/01/2026 02:31PM',
  },
  {
    name: 'SEAMUS DANIEL III',
    sharesVoted: 272436,
    source: 'PRINT',
    dateVoted: '04/25/2026 11:00AM',
  },
  {
    name: 'IUDICIT CAPITAL CORP',
    sharesVoted: 268803,
    source: 'WEB',
    dateVoted: '04/29/2026 03:17PM',
  },
  // TORUM votes 252,240 of its 256,090 shares
  {
    name: 'TORUM CAPITAL LLC',
    sharesVoted: 252240,
    source: 'WEB',
    dateVoted: '04/27/2026 08:54AM',
  },
]
// Verify total: 2,052,355 + 1,670,944 + 1,107,909 + 272,436 + 268,803 + 252,240 = 5,624,687

const INSTITUTIONAL_NAMES = new Set([
  'WELLINGTON MANAGEMENT',
  'T. ROWE PRICE',
  'BANK OF AMERICA CORP',
  'IUDICIT CAPITAL CORP',
  'TORUM CAPITAL LLC',
])

async function run() {
  const client = new pg.Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.vfgjzlcakdrpsbzuqklz',
    password: POSTGRES_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Connected')

  try {
    await client.query('BEGIN')

    // 1. Mark positions as voted
    console.log('\n📊 Updating position vote statuses...')
    let totalVotedShares = 0
    for (const pos of VOTED_POSITIONS) {
      const res = await client.query(
        `UPDATE position
         SET vote_status = 'Voted',
             shares_voted = $1,
             source = $2,
             date_voted = $3,
             updated_at = NOW()
         WHERE meeting_id = $4 AND name = $5
         RETURNING id, name, shares, shares_voted`,
        [pos.sharesVoted, pos.source, pos.dateVoted, MEETING_ID, pos.name]
      )
      if (res.rowCount === 0) {
        console.warn(`  ⚠️  No position found for: ${pos.name}`)
      } else {
        const row = res.rows[0]
        totalVotedShares += Number(row.shares_voted)
        console.log(
          `  ✓ ${row.name}: ${Number(row.shares_voted).toLocaleString()} shares voted`
        )
      }
    }
    console.log(`  Total voted shares: ${totalVotedShares.toLocaleString()}`)

    // 2. Fetch proposals for this meeting
    const proposalsRes = await client.query(
      `SELECT id, proposal_number, proposal_type FROM proposal
       WHERE meeting_id = $1
       ORDER BY proposal_number`,
      [MEETING_ID]
    )
    const proposals = proposalsRes.rows
    console.log(`\n📋 Found ${proposals.length} proposals`)

    // 3. Delete any existing position_vote records for these positions
    console.log('\n🗑️  Clearing existing position_vote records...')
    const delRes = await client.query(
      `DELETE FROM position_vote
       WHERE position_id IN (
         SELECT id FROM position
         WHERE meeting_id = $1
           AND name = ANY($2::text[])
       )`,
      [MEETING_ID, VOTED_POSITIONS.map((p) => p.name)]
    )
    console.log(`  Deleted ${delRes.rowCount} existing records`)

    // 4. Fetch voted position IDs
    const posRes = await client.query(
      `SELECT id, name, shares_voted FROM position
       WHERE meeting_id = $1 AND vote_status = 'Voted'
       ORDER BY shares_voted DESC`,
      [MEETING_ID]
    )
    const votedPositions = posRes.rows

    // 5. Insert position_vote records
    console.log('\n🗳️  Inserting position_vote records...')
    let voteCount = 0
    for (const position of votedPositions) {
      const isInstitutional = INSTITUTIONAL_NAMES.has(position.name)
      const sharesVoted = Number(position.shares_voted)

      for (const proposal of proposals) {
        const isShareholderProposal = proposal.proposal_type === 'Shareholder Proposal'
        let vote: string

        if (isShareholderProposal) {
          vote = isInstitutional ? 'AGAINST' : 'ABSTAIN'
        } else {
          vote = 'FOR'
        }

        await client.query(
          `INSERT INTO position_vote (id, position_id, proposal_id, vote, shares_voting, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
          [position.id, proposal.id, vote, sharesVoted.toString()]
        )
        voteCount++
      }
    }
    console.log(`  Inserted ${voteCount} position_vote records`)

    // 6. Update proposal totals
    console.log('\n📈 Updating proposal vote totals...')

    // Institutional shares (all voted positions except SEAMUS)
    const seamus = VOTED_POSITIONS.find((p) => p.name === 'SEAMUS DANIEL III')!
    const institutionalShares = totalVotedShares - seamus.sharesVoted // 5,352,251
    const totalSharesEligible = 190466246

    for (const proposal of proposals) {
      const isShareholderProposal = proposal.proposal_type === 'Shareholder Proposal'

      const totalVotesFor = isShareholderProposal ? 0 : totalVotedShares
      const totalVotesAgainst = isShareholderProposal ? institutionalShares : 0
      const totalVotesAbstain = isShareholderProposal ? seamus.sharesVoted : 0
      const participationRate = (totalVotedShares / totalSharesEligible) * 100
      const forPct = (totalVotesFor / totalSharesEligible) * 100
      const againstPct = (totalVotesAgainst / totalSharesEligible) * 100
      const abstainPct = (totalVotesAbstain / totalSharesEligible) * 100

      await client.query(
        `UPDATE proposal
         SET total_votes_for = $1,
             total_votes_against = $2,
             total_votes_abstain = $3,
             total_shares_eligible = $4,
             for_percentage = $5,
             against_percentage = $6,
             abstain_percentage = $7,
             participation_rate = $8,
             final_result = 'PENDING',
             voting_completed = false,
             voting_completed_at = NULL,
             updated_at = NOW()
         WHERE id = $9`,
        [
          totalVotesFor,
          totalVotesAgainst,
          totalVotesAbstain,
          totalSharesEligible,
          forPct.toFixed(4),
          againstPct.toFixed(4),
          abstainPct.toFixed(4),
          participationRate.toFixed(4),
          proposal.id,
        ]
      )
      console.log(
        `  ✓ Proposal ${Number(proposal.proposal_number).toFixed(2)}: FOR=${totalVotesFor.toLocaleString()}, AGAINST=${totalVotesAgainst.toLocaleString()}, ABSTAIN=${totalVotesAbstain.toLocaleString()}`
      )
    }

    // 7. Update tabulation report to match
    await client.query(
      `UPDATE tabulation_report
       SET positions_voted = $1::jsonb,
           last_calculated_at = NOW(),
           updated_at = NOW()
       WHERE meeting_id = $2`,
      [
        JSON.stringify({
          voted: votedPositions.length,
          unvoted: 51 - votedPositions.length,
          totalShares: totalSharesEligible,
          votedShares: totalVotedShares,
        }),
        MEETING_ID,
      ]
    )
    console.log('\n✅ Updated tabulation_report positions_voted')

    await client.query('COMMIT')
    console.log('\n🎉 Done! Summary:')
    console.log(`   Positions voted:    ${votedPositions.length}`)
    console.log(`   Shares voted:       ${totalVotedShares.toLocaleString()}`)
    console.log(
      `   Shares not voted:   ${(totalSharesEligible - totalVotedShares).toLocaleString()}`
    )
    console.log(
      `   % Voted:            ${((totalVotedShares / totalSharesEligible) * 100).toFixed(2)}%`
    )
    console.log(`   position_vote rows: ${voteCount}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error, rolled back:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

void run()
