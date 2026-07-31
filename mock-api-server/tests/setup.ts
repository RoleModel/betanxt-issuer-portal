import * as path from "node:path";
import { config } from "dotenv";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

export default function globalSetup() {
  // Load environment variables for tests
  config({ path: path.join(__dirname, "../.env.local") });
  config({ path: path.join(__dirname, "../.env.development.local") });

  // Validate required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Warning: Missing required environment variables for tests");
    console.warn("SUPABASE_URL:", !!process.env.SUPABASE_URL);
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}
