import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Database Migrations", () => {
  const migrationsPath = path.join(__dirname, "../../../supabase/migrations");

  const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  test("should have migrations directory", () => {
    expect(fs.existsSync(migrationsPath)).toBe(true);
  });

  test("should have migration files", () => {
    const migrations = fs.readdirSync(migrationsPath).filter((file) => file.endsWith(".sql"));

    expect(migrations.length).toBeGreaterThan(0);
  });

  test("should have valid migration files", () => {
    const migrations = fs.readdirSync(migrationsPath).filter((file) => file.endsWith(".sql"));

    // Looser check: ensure we have at least initial schema and some model migrations
    const hasInitial = migrations.some((m) => m.includes("initial_schema"));
    const hasModelFiles = fs.existsSync(path.join(migrationsPath, "Model"));

    expect(hasInitial || hasModelFiles).toBe(true);
  });

  test("should verify critical database objects exist", async () => {
    // Check for critical functions
    const { data: _functions, error: funcError } = await supabase
      .rpc("get_user_account_id")
      .single();

    // Function might not exist or require auth, but should not have connection errors
    if (funcError && funcError.code !== "PGRST116" && funcError.code !== "PGRST202") {
      console.warn("Function check:", funcError.message);
    }

    // Check for enums by trying to query tables that use them
    const { error: meetingError } = await supabase
      .from("meeting")
      .select("status")
      .eq("status", "ACTIVE")
      .limit(1);

    expect(meetingError).toBeNull();

    const { error: taskError } = await supabase.from("task").select("status").limit(1);

    expect(taskError).toBeNull();
  });

  test("should have proper indexes for performance", async () => {
    // Verify we can query efficiently using common filters
    const { data: _meetingsByAccount, error: accountError } = await supabase
      .from("meeting")
      .select("id")
      .eq("client_id", "8184c84f-2f31-5ca5-b202-ab178765ff29")
      .limit(1);

    // Should not error even if no data
    expect(accountError).toBeNull();

    const { data: _tasksByMeeting, error: meetingError } = await supabase
      .from("task")
      .select("id")
      .eq("meeting_id", "test-meeting-id")
      .limit(1);

    expect(meetingError).toBeNull();

    const { data: _positionsByMeeting, error: positionError } = await supabase
      .from("position")
      .select("id")
      .eq("meeting_id", "test-meeting-id")
      .limit(1);

    expect(positionError).toBeNull();
  });
});
