import { config } from "dotenv";
import { parseEnv, z } from "znv";

// Load environment variables
config({ path: ".env.development.local" });

export const appConfig = parseEnv(process.env, {
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().min(1),
});
