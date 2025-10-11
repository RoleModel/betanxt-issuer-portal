#!/usr/bin/env tsx
import { Client } from 'pg'

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? 'ZgnAkgxVLYDcf9gj'

async function cleanupOrphanedRecords() {
  // Try pooler connection first, fall back to direct connection
  const client = new Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.vfgjzlcakdrpsbzuqklz',
    password: POSTGRES_PASSWORD,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log('🔌 Connecting to remote database...')
    await client.connect()
    console.log('✅ Connected!')

    // Find orphaned document_history records
    console.log('\n📋 Checking document_history table...')
    const orphanedHistoryQuery = `
      SELECT dh.id, dh.document_id, dh.event_type, dh.created_at
      FROM document_history dh
      LEFT JOIN document d ON dh.document_id = d.id
      WHERE d.id IS NULL
      ORDER BY dh.created_at DESC
    `
    const orphanedHistoryResult = await client.query(orphanedHistoryQuery)

    if (orphanedHistoryResult.rows.length > 0) {
      console.log(
        `⚠️  Found ${orphanedHistoryResult.rows.length} orphaned document_history records`
      )

      // Delete orphaned document_history records
      const deleteHistoryQuery = `
        DELETE FROM document_history dh
        WHERE NOT EXISTS (
          SELECT 1 FROM document d WHERE d.id = dh.document_id
        )
      `
      const deleteHistoryResult = await client.query(deleteHistoryQuery)
      console.log(
        `✅ Deleted ${deleteHistoryResult.rowCount} orphaned document_history records`
      )
    } else {
      console.log('✅ No orphaned document_history records found')
    }

    // Find orphaned comment records
    console.log('\n📋 Checking comment table...')
    const orphanedCommentsQuery = `
      SELECT c.id, c.document_id, c.created_at
      FROM comment c
      LEFT JOIN document d ON c.document_id = d.id
      WHERE c.document_id IS NOT NULL AND d.id IS NULL
      ORDER BY c.created_at DESC
    `
    const orphanedCommentsResult = await client.query(orphanedCommentsQuery)

    if (orphanedCommentsResult.rows.length > 0) {
      console.log(
        `⚠️  Found ${orphanedCommentsResult.rows.length} orphaned comment records:`
      )
      orphanedCommentsResult.rows.slice(0, 5).forEach((row) => {
        console.log(`   - ID: ${row.id}, Document ID: ${row.document_id}`)
      })
      if (orphanedCommentsResult.rows.length > 5) {
        console.log(`   ... and ${orphanedCommentsResult.rows.length - 5} more`)
      }

      // Delete orphaned comment records
      const deleteCommentsQuery = `
        DELETE FROM comment c
        WHERE c.document_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM document d WHERE d.id = c.document_id
        )
      `
      const deleteCommentsResult = await client.query(deleteCommentsQuery)
      console.log(`✅ Deleted ${deleteCommentsResult.rowCount} orphaned comment records`)
    } else {
      console.log('✅ No orphaned comment records found')
    }

    // Find orphaned signature records
    console.log('\n📋 Checking signature table...')
    const orphanedSignaturesQuery = `
      SELECT s.id, s.document_id, s.created_at
      FROM signature s
      LEFT JOIN document d ON s.document_id = d.id
      WHERE s.document_id IS NOT NULL AND d.id IS NULL
      ORDER BY s.created_at DESC
    `
    const orphanedSignaturesResult = await client.query(orphanedSignaturesQuery)

    if (orphanedSignaturesResult.rows.length > 0) {
      console.log(
        `⚠️  Found ${orphanedSignaturesResult.rows.length} orphaned signature records`
      )

      // Delete orphaned signature records
      const deleteSignaturesQuery = `
        DELETE FROM signature s
        WHERE s.document_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM document d WHERE d.id = s.document_id
        )
      `
      const deleteSignaturesResult = await client.query(deleteSignaturesQuery)
      console.log(
        `✅ Deleted ${deleteSignaturesResult.rowCount} orphaned signature records`
      )
    } else {
      console.log('✅ No orphaned signature records found')
    }

    // Find orphaned position_vote records
    console.log('\n📋 Checking position_vote table...')
    const orphanedVotesQuery = `
      SELECT pv.id, pv.position_id, pv.created_at
      FROM position_vote pv
      LEFT JOIN "position" p ON pv.position_id = p.id
      WHERE pv.position_id IS NOT NULL AND p.id IS NULL
      ORDER BY pv.created_at DESC
    `
    const orphanedVotesResult = await client.query(orphanedVotesQuery)

    if (orphanedVotesResult.rows.length > 0) {
      console.log(
        `⚠️  Found ${orphanedVotesResult.rows.length} orphaned position_vote records`
      )

      // Delete orphaned position_vote records
      const deleteVotesQuery = `
        DELETE FROM position_vote pv
        WHERE pv.position_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "position" p WHERE p.id = pv.position_id
        )
      `
      const deleteVotesResult = await client.query(deleteVotesQuery)
      console.log(
        `✅ Deleted ${deleteVotesResult.rowCount} orphaned position_vote records`
      )
    } else {
      console.log('✅ No orphaned position_vote records found')
    }

    // Final verification
    console.log('\n✅ Verifying cleanup...')
    const verifyHistory = await client.query(orphanedHistoryQuery)
    const verifyComments = await client.query(orphanedCommentsQuery)
    const verifySignatures = await client.query(orphanedSignaturesQuery)
    const verifyVotes = await client.query(orphanedVotesQuery)

    const totalOrphaned =
      verifyHistory.rows.length +
      verifyComments.rows.length +
      verifySignatures.rows.length +
      verifyVotes.rows.length

    if (totalOrphaned === 0) {
      console.log('✅ All orphaned records have been cleaned up!')
    } else {
      console.log(`⚠️  Still found ${totalOrphaned} orphaned records:`)
      console.log(`   - document_history: ${verifyHistory.rows.length}`)
      console.log(`   - comment: ${verifyComments.rows.length}`)
      console.log(`   - signature: ${verifySignatures.rows.length}`)
      console.log(`   - position_vote: ${verifyVotes.rows.length}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

cleanupOrphanedRecords().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})
