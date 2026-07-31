import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

// Load environment variables from .env.local
config({ path: ".env.local" });

const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "ZgnAkgxVLYDcf9gj";

async function migrateRemote() {
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

    // Check if schema exists
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    if (tables.length > 0) {
      console.log(`ℹ️  Schema already exists (${tables.length} tables found)`);
      console.log(
        "   Skipping migrations - use truncate-remote.ts first to reset schema"
      );
      return;
    }

    console.log("\n📋 Applying migrations...");

    // Read migrations from data directory (bundled with deployment)
    const migrationsDir = path.join(process.cwd(), "data", "migrations");
    const migrationFiles = await readdir(migrationsDir);
    const sqlMigrations = migrationFiles
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const migrationFile of sqlMigrations) {
      console.log(`   Applying: ${migrationFile}`);
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migrationSql = await readFile(migrationPath, "utf-8");
      await client.query(migrationSql);
    }

    console.log(`✅ Applied ${sqlMigrations.length} migrations successfully!`);

    // Verify schema was created
    const { rows: newTables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log(`✅ Verified: ${newTables.length} tables created`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (endError) {
      // Ignore connection termination errors
      if (endError && typeof endError === "object" && "code" in endError) {
        const { code } = endError as { code?: string };
        if (code !== "57P01" && code !== "ECONNRESET") {
          console.error("⚠️  Warning: Error closing connection:", endError);
        }
      }
    }
  }
}

// Handle connection termination errors from Supabase pooler
const handleConnectionError = (error: unknown): boolean => {
  const errorString = String(error);
  if (
    errorString.includes("db_termination") ||
    errorString.includes("shutdown") ||
    errorString.includes("ECONNRESET") ||
    errorString.includes("57P01")
  ) {
    // Expected - Supabase pooler terminates connections
    return true;
  }
  return false;
};

process.on("uncaughtException", (error) => {
  if (handleConnectionError(error)) {
    process.exit(0);
  }
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  if (handleConnectionError(error)) {
    process.exit(0);
  }
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

migrateRemote().catch((error) => {
  const errorString = String(error);
  if (
    errorString.includes("db_termination") ||
    errorString.includes("shutdown") ||
    errorString.includes("ECONNRESET") ||
    errorString.includes("57P01")
  ) {
    console.log(
      "ℹ️  Database connection terminated (expected after migrations)"
    );
    process.exit(0);
  }
  console.error("Migration failed:", error);
  process.exit(1);
});
