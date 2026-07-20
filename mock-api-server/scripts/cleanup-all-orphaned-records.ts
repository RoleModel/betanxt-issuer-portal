#!/usr/bin/env tsx
import { config } from "dotenv";
import { Client } from "pg";

// Load environment variables from .env.local
config({ path: ".env.local" });

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "ZgnAkgxVLYDcf9gj";

/**
 * Comprehensive cleanup of ALL orphaned records in the database
 * This handles all foreign key relationships that will be enforced by the migration
 */
async function cleanupAllOrphanedRecords() {
  const client = new Client({
    host: "aws-1-us-east-2.pooler.supabase.com",
    port: 5432,
    user: "postgres.vfgjzlcakdrpsbzuqklz",
    password: POSTGRES_PASSWORD,
    database: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔌 Connecting to remote database...");
    await client.connect();
    console.log("✅ Connected!");

    let totalDeleted = 0;

    // 1. Clean up orphaned document_history records (document_id -> document)
    console.log("\n📋 Cleaning document_history...");
    const deleteHistory = await client.query(`
      DELETE FROM document_history dh
      WHERE NOT EXISTS (
        SELECT 1 FROM document d WHERE d.id = dh.document_id
      )
    `);
    console.log(`   Deleted ${deleteHistory.rowCount} orphaned records`);
    totalDeleted += deleteHistory.rowCount ?? 0;

    // 2. Clean up orphaned comments (document_id -> document)
    console.log("\n📋 Cleaning comment...");
    const deleteComments = await client.query(`
      DELETE FROM comment c
      WHERE c.document_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM document d WHERE d.id = c.document_id
      )
    `);
    console.log(`   Deleted ${deleteComments.rowCount} orphaned records`);
    totalDeleted += deleteComments.rowCount ?? 0;

    // 3. Clean up orphaned signatures (document_id -> document)
    console.log("\n📋 Cleaning signature...");
    const deleteSignatures = await client.query(`
      DELETE FROM signature s
      WHERE s.document_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM document d WHERE d.id = s.document_id
      )
    `);
    console.log(`   Deleted ${deleteSignatures.rowCount} orphaned records`);
    totalDeleted += deleteSignatures.rowCount ?? 0;

    // 4. Clean up orphaned position_vote records (position_id -> position)
    console.log("\n📋 Cleaning position_vote...");
    const deleteVotes = await client.query(`
      DELETE FROM position_vote pv
      WHERE pv.position_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "position" p WHERE p.id = pv.position_id
      )
    `);
    console.log(`   Deleted ${deleteVotes.rowCount} orphaned records`);
    totalDeleted += deleteVotes.rowCount ?? 0;

    // 5. Clean up orphaned positions (meeting_id -> meeting)
    console.log("\n📋 Cleaning position (meeting_id)...");
    const deletePositionsMeeting = await client.query(`
      DELETE FROM "position" p
      WHERE p.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = p.meeting_id
      )
    `);
    console.log(
      `   Deleted ${deletePositionsMeeting.rowCount} orphaned records`
    );
    totalDeleted += deletePositionsMeeting.rowCount ?? 0;

    // 6. Clean up orphaned proposals (meeting_id -> meeting)
    console.log("\n📋 Cleaning proposal...");
    const deleteProposals = await client.query(`
      DELETE FROM proposal p
      WHERE p.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = p.meeting_id
      )
    `);
    console.log(`   Deleted ${deleteProposals.rowCount} orphaned records`);
    totalDeleted += deleteProposals.rowCount ?? 0;

    // 7. Clean up orphaned documents (meeting_id -> meeting)
    console.log("\n📋 Cleaning document...");
    const deleteDocuments = await client.query(`
      DELETE FROM document d
      WHERE d.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = d.meeting_id
      )
    `);
    console.log(`   Deleted ${deleteDocuments.rowCount} orphaned records`);
    totalDeleted += deleteDocuments.rowCount ?? 0;

    // 8. Clean up orphaned tasks (meeting_id -> meeting)
    console.log("\n📋 Cleaning task (meeting_id)...");
    const deleteTasksMeeting = await client.query(`
      DELETE FROM task t
      WHERE t.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = t.meeting_id
      )
    `);
    console.log(`   Deleted ${deleteTasksMeeting.rowCount} orphaned records`);
    totalDeleted += deleteTasksMeeting.rowCount ?? 0;

    // 9. Clean up orphaned tasks (phase_id -> phase)
    console.log("\n📋 Cleaning task (phase_id)...");
    const deleteTasksPhase = await client.query(`
      DELETE FROM task t
      WHERE t.phase_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM phase p WHERE p.id = t.phase_id
      )
    `);
    console.log(`   Deleted ${deleteTasksPhase.rowCount} orphaned records`);
    totalDeleted += deleteTasksPhase.rowCount ?? 0;

    // 10. Clean up orphaned phases (meeting_id -> meeting)
    console.log("\n📋 Cleaning phase...");
    const deletePhases = await client.query(`
      DELETE FROM phase p
      WHERE p.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = p.meeting_id
      )
    `);
    console.log(`   Deleted ${deletePhases.rowCount} orphaned records`);
    totalDeleted += deletePhases.rowCount ?? 0;

    // 11. Clean up orphaned mailings (meeting_id -> meeting)
    console.log("\n📋 Cleaning mailing...");
    const deleteMailings = await client.query(`
      DELETE FROM mailing m
      WHERE m.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting mt WHERE mt.id = m.meeting_id
      )
    `);
    console.log(`   Deleted ${deleteMailings.rowCount} orphaned records`);
    totalDeleted += deleteMailings.rowCount ?? 0;

    // 12. Clean up orphaned meetings (client_id -> clients)
    console.log("\n📋 Cleaning meeting...");
    const deleteMeetings = await client.query(`
      DELETE FROM meeting m
      WHERE m.ticker IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM clients c WHERE c.ticker = m.ticker
      )
    `);
    console.log(`   Deleted ${deleteMeetings.rowCount} orphaned records`);
    totalDeleted += deleteMeetings.rowCount ?? 0;

    // 13. Clean up orphaned users (account_id -> account)
    console.log("\n📋 Cleaning user...");
    const deleteUsers = await client.query(`
      DELETE FROM "user" u
      WHERE u.account_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM account a WHERE a.id = u.account_id
      )
    `);
    console.log(`   Deleted ${deleteUsers.rowCount} orphaned records`);
    totalDeleted += deleteUsers.rowCount ?? 0;

    // 14. Clean up orphaned accounts (client_id -> clients)
    console.log("\n📋 Cleaning account...");
    const deleteAccounts = await client.query(`
      DELETE FROM account a
      WHERE a.client_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM clients c WHERE c.id = a.client_id
      )
    `);
    console.log(`   Deleted ${deleteAccounts.rowCount} orphaned records`);
    totalDeleted += deleteAccounts.rowCount ?? 0;

    // 15. Clean up orphaned notifications (user_id -> user)
    console.log("\n📋 Cleaning notification...");
    const deleteNotifications = await client.query(`
      DELETE FROM notification n
      WHERE n.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "user" u WHERE u.id = n.user_id
      )
    `);
    console.log(`   Deleted ${deleteNotifications.rowCount} orphaned records`);
    totalDeleted += deleteNotifications.rowCount ?? 0;

    // 16. Clean up orphaned tabulation_report (meeting_id -> meeting)
    console.log("\n📋 Cleaning tabulation_report...");
    const deleteTabulationReports = await client.query(`
      DELETE FROM tabulation_report tr
      WHERE tr.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = tr.meeting_id
      )
    `);
    console.log(
      `   Deleted ${deleteTabulationReports.rowCount} orphaned records`
    );
    totalDeleted += deleteTabulationReports.rowCount ?? 0;

    // 17. Clean up orphaned digital_shareholder_meeting (meeting_id -> meeting)
    console.log("\n📋 Cleaning digital_shareholder_meeting...");
    const deleteDSM = await client.query(`
      DELETE FROM digital_shareholder_meeting dsm
      WHERE dsm.meeting_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM meeting m WHERE m.id = dsm.meeting_id
      )
    `);
    console.log(`   Deleted ${deleteDSM.rowCount} orphaned records`);
    totalDeleted += deleteDSM.rowCount ?? 0;

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Cleanup complete! Total records deleted: ${totalDeleted}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupAllOrphanedRecords().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});
