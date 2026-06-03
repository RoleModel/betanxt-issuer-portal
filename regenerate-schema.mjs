#!/usr/bin/env node
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

console.log("🔧 Regenerating PostgreSQL schema to fix HTML entity issues...");

try {
  const { stdout, stderr } = await execAsync(
    "cd /Users/dallas/Development/betanxt-issuer-portal/mock-api-server && npm run generate:postgres-schema",
    { timeout: 60000 },
  );

  console.log("✅ Schema regeneration completed!");
  console.log("Output:", stdout);

  if (stderr) {
    console.log("Warnings:", stderr);
  }
} catch (error) {
  console.error("❌ Schema regeneration failed:");
  console.error(error.message);

  if (error.stdout) {
    console.log("Output:", error.stdout);
  }

  if (error.stderr) {
    console.error("Error details:", error.stderr);
  }
}
