/**
 * Upload seed.sql to Supabase storage as backup.sql
 * This file is used by the reset-demo-data API endpoint
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: join(process.cwd(), ".env.local") });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vfgjzlcakdrpsbzuqklz.supabase.co";
const { SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required"
  );
  console.error("Make sure it is set in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function uploadSeed() {
  try {
    console.log("Reading seed.sql...");
    const seedPath = join(process.cwd(), "..", "supabase", "seed.sql");
    const seedContent = readFileSync(seedPath, "utf-8");

    console.log(
      `Seed file size: ${(seedContent.length / 1024 / 1024).toFixed(2)} MB`
    );

    // Upload to Supabase storage
    console.log("Uploading to Supabase storage...");
    const { data, error } = await supabase.storage
      .from("documents")
      .upload("backup.sql", seedContent, {
        contentType: "text/plain",
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    console.log("✅ Successfully uploaded backup.sql to Supabase storage");
    console.log("Path:", data.path);
    console.log(
      "URL:",
      `${SUPABASE_URL}/storage/v1/object/public/documents/${data.path}`
    );
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
}

void uploadSeed();
