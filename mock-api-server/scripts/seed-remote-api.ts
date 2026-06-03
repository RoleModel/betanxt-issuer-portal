#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

const SUPABASE_URL =
  (process.env.REMOTE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) ??
  "https://vfgjzlcakdrpsbzuqklz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ REMOTE_SUPABASE_SERVICE_ROLE_KEY is required");
  console.error("Set it in your environment or .env file");
  console.error(
    "Get it from: https://supabase.com/dashboard/project/vfgjzlcakdrpsbzuqklz/settings/api",
  );
  process.exit(1);
}

console.log("🔄 Seeding remote Supabase database via REST API...");
console.log(`   URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedRemote() {
  try {
    // Read the local seed SQL to get data
    const localSeedPath = join(process.cwd(), "..", "supabase", "seed.sql");
    console.log(`📄 Reading seed file: ${localSeedPath}`);
    const seedSQL = readFileSync(localSeedPath, "utf-8");

    console.log(`📊 Seed file size: ${(seedSQL.length / 1024).toFixed(2)} KB`);

    // Instead of parsing SQL, let's just copy data from local to remote
    console.log("🔄 Copying data from local to remote...");

    const localSupabase = createClient(
      "http://127.0.0.1:54321",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
    );

    // Tables in order respecting foreign key dependencies
    // Parents must come before children for inserts
    const tables = [
      "clients",
      "account",
      "user",
      "meeting",
      "mailing",
      "phase",
      "task",
      "document",
      "proposal",
      "position",
      "position_vote",
      "notification",
      "comment",
      "tabulation_report",
      "digital_shareholder_meeting",
      "dsm_config",
      "document_history",
      "signature",
    ];

    // Step 1: Clear all tables in reverse order (children first, parents last)
    console.log("\n🗑️  Step 1: Clearing all remote tables...");
    for (const table of [...tables].reverse()) {
      console.log(`   Clearing ${table}...`);

      let totalDeleted = 0;
      let hasMore = true;
      let attempts = 0;
      const maxAttempts = 100; // Safety limit

      // Delete all records in smaller batches to handle large tables
      while (hasMore && attempts < maxAttempts) {
        attempts++;

        const { data: existingRecords, error: selectError } = await supabase
          .from(table)
          .select("id")
          .limit(100); // Smaller batches for large tables

        if (selectError) {
          console.error(`   ⚠️  Failed to query ${table}:`, selectError.message);
          break;
        }

        if (existingRecords && existingRecords.length > 0) {
          const ids = existingRecords.map((r) => r.id);
          const { error: deleteError } = await supabase.from(table).delete().in("id", ids);

          if (deleteError) {
            console.error(`   ⚠️  Failed to delete from ${table}:`, deleteError.message);
            // Try to continue despite errors
            hasMore = false;
          } else {
            totalDeleted += ids.length;
            hasMore = existingRecords.length === 100; // Continue if we got a full batch

            if (totalDeleted % 1000 === 0) {
              console.log(`   🔄 Deleted ${totalDeleted} records so far...`);
            }
          }
        } else {
          hasMore = false;
        }
      }

      if (totalDeleted > 0) {
        console.log(`   ✅ Deleted ${totalDeleted} records from ${table}`);
      } else {
        console.log(`   ⏭️  ${table} already empty`);
      }
    }

    // Step 2: Insert data in forward order (parents first, children last)
    console.log("\n📥 Step 2: Inserting data into remote tables...");
    for (const table of tables) {
      console.log(`\n📋 Processing table: ${table}`);

      // Fetch all data from local using pagination (Supabase has 1000 row limit per query)
      let localData: Record<string, unknown>[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      console.log(`   📥 Fetching data from local...`);
      while (hasMore) {
        const { data: pageData, error: fetchError } = await localSupabase
          .from(table)
          .select("*")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (fetchError) {
          console.error(
            `⚠️  Failed to fetch page ${page} from local ${table}:`,
            fetchError.message,
          );
          break;
        }

        if (pageData && pageData.length > 0) {
          localData = localData.concat(pageData);
          page++;
          hasMore = pageData.length === pageSize;
          if (localData.length % 5000 === 0) {
            console.log(`   📊 Fetched ${localData.length} records so far...`);
          }
        } else {
          hasMore = false;
        }
      }

      if (!localData || localData.length === 0) {
        console.log(`   ⏭️  Skipping ${table} (no data)`);
        continue;
      }

      console.log(`   📊 Found ${localData.length} total records`);

      // Use smaller batches for large tables to avoid Supabase limits
      const batchSize = table === "position" || table === "position_vote" ? 100 : 500;
      let inserted = 0;
      let failed = 0;

      for (let i = 0; i < localData.length; i += batchSize) {
        const batch = localData.slice(i, i + batchSize);

        const { error: insertError, data: insertData } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (insertError) {
          console.error(
            `   ❌ Failed to insert batch ${i}-${i + batch.length}:`,
            insertError.message,
          );
          console.log(`   🔄 Retrying batch one by one...`);

          // Try one by one to identify problematic records
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            const { error } = await supabase.from(table).insert(row);
            if (!error) {
              inserted++;
              if (inserted % 100 === 0) {
                console.log(`   📊 Progress: ${inserted}/${localData.length}`);
              }
            } else {
              failed++;
              if (failed <= 5) {
                console.error(`   ⚠️  Failed record ${i + j}:`, error.message);
                console.error(`   Record data:`, JSON.stringify(row).substring(0, 200));
              }
            }
          }
        } else {
          inserted += insertData?.length || batch.length;
          if (i % 1000 === 0 || inserted === localData.length) {
            console.log(`   ✅ Inserted ${inserted}/${localData.length}`);
          }
        }

        // Add small delay for large tables to avoid rate limiting
        if (localData.length > 5000 && i % 1000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(
        `   ✅ Completed ${table}: ${inserted}/${localData.length} records inserted, ${failed} failed`,
      );

      // For critical parent tables, abort if inserts failed
      const criticalTables = ["clients", "meeting", "position", "document"];
      if (criticalTables.includes(table) && inserted < localData.length) {
        console.error(`   ❌ Critical table ${table} had ${failed} failed inserts - aborting`);
        console.error(`   This will cause FK violations in child tables`);
        process.exit(1);
      }

      // Special verification for position table before position_vote
      if (table === "position") {
        console.log(`\n   🔍 Verifying position table integrity...`);
        const { count: remoteCount } = await supabase
          .from("position")
          .select("*", { count: "exact", head: true });
        console.log(`   Local positions: ${localData.length}, Remote positions: ${remoteCount}`);

        if (remoteCount !== localData.length) {
          console.error(`   ❌ Position count mismatch! Some positions failed to insert.`);
          console.error(`   Missing: ${localData.length - (remoteCount || 0)} positions`);
          console.error(`   This will cause FK violations in position_vote table`);
          process.exit(1);
        }
      }
    }

    console.log("\n✅ Database seeded successfully!");

    // Verify
    const { count } = await supabase.from("clients").select("*", { count: "exact", head: true });

    console.log(`✅ Verified: ${count} clients in remote database`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedRemote().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
