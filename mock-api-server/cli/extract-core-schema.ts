import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

/**
 * Extract only core data model tables from the generated PostgreSQL schema
 * This excludes request/response schemas and focuses on actual data models
 */

const CORE_TABLES = [
  "clients",
  "account",
  "user",
  "meeting",
  "phase",
  "task",
  "document",
  "document_history",
  "digital_shareholder_meeting",
  "comment",
  "signature",
  "position",
  "position_vote",
  "proposal",
  "notification",
  "mailing",
  "tabulation_report",
  "dsm_config",
];

function extractCoreSchema() {
  const migrationsDir = join(__dirname, "../../supabase/migrations");
  const schemaPath = join(
    __dirname,
    "../../supabase/migrations/postgresql_schema.sql"
  );

  // Read the schema file
  let fullSchema = "";
  try {
    fullSchema = readFileSync(schemaPath, "utf-8");
  } catch (error) {
    console.error(`Failed to load schema from ${schemaPath}`, error);
    process.exit(1);
  }

  // Clean up old generated files
  const existingFiles = readdirSync(migrationsDir);
  for (const file of existingFiles) {
    // Remove old initial schema migrations
    if (/^\d{14}_initial_schema\.sql$/.test(file)) {
      unlinkSync(join(migrationsDir, file));
    }
  }

  // Generate timestamp for migration filename (YYYYMMDDHHMMSS format)
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const migrationPath = join(
    __dirname,
    `../../supabase/migrations/${timestamp}_initial_schema.sql`
  );

  let coreSchema = `-- BetaNXT Issuer Portal Database Schema
-- Generated from OpenAPI specification (core data models only)
-- Date: ${new Date().toISOString()}

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types first
`;

  // Extract enum definitions first
  const SKIP_TYPES = new Set<string>();

  const enumMatches = fullSchema.match(/CREATE TYPE[^;]+;/g) || [];
  enumMatches.forEach((enumDef) => {
    // Extract type name
    const typeNameMatch = /CREATE TYPE (\w+)/.exec(enumDef);
    if (typeNameMatch) {
      const typeName = typeNameMatch[1];

      // Skip types that are managed by other migrations
      if (SKIP_TYPES.has(typeName)) {
        return;
      }

      // Add DROP IF EXISTS with CASCADE for types that might have dependencies
      coreSchema += `DROP TYPE IF EXISTS ${typeName} CASCADE;\n`;
    }
    coreSchema += `${enumDef}\n\n`;
  });

  // Extract core table definitions and their comments
  const _usedComments = new Set();

  for (const tableName of CORE_TABLES) {
    // Look for the table definition including its full structure
    // Updated regex to handle the actual format: "-- Table 'name' generated from model...\n--\nCREATE TABLE..."
    const tableStartRegex = new RegExp(
      `-- Table '${tableName}'[\\s\\S]*?CREATE TABLE[\\s\\S]*?\\);`,
      "g"
    );
    const matches = fullSchema.match(tableStartRegex);

    if (matches?.[0]) {
      let tableSection = matches[0];

      // Replace CREATE TABLE IF NOT EXISTS with DROP + CREATE TABLE
      // This ensures clean migrations that always recreate tables
      tableSection = tableSection.replace(
        /CREATE TABLE IF NOT EXISTS (public\.)?("?\w+"?)/,
        (match, schema, tableName) =>
          `DROP TABLE IF EXISTS ${schema ?? ""}${tableName} CASCADE;\nCREATE TABLE ${schema ?? ""}${tableName}`
      );

      coreSchema += `${tableSection}\n`;

      // Add COMMENT statements for this table only (exact matches only)
      const escapedTableName = RegExp.escape(tableName);
      const tableCommentRegex = new RegExp(
        `COMMENT ON TABLE (?:public\\.)?(?:")?${escapedTableName}(?:")?\\b[^;]*?;`,
        "g"
      );
      const columnCommentRegex = new RegExp(
        `COMMENT ON COLUMN (?:public\\.)?(?:")?${escapedTableName}(?:")?\\.[^;]*?;`,
        "g"
      );

      // Reset regex state for global search
      tableCommentRegex.lastIndex = 0;
      columnCommentRegex.lastIndex = 0;

      // Function to sanitize COMMENT statements
      const _sanitizeComment = (_comment: string): string =>
        _comment
          .replaceAll("&#x60;", "") // Remove HTML encoded backticks entirely
          .replaceAll("&#x27;", "'") // Replace HTML encoded single quotes (hex format)
          .replaceAll("&#39;", "'") // Replace HTML encoded single quotes (decimal format)
          .replaceAll("&quot;", '"') // Replace HTML entities for double quotes
          .replaceAll("&amp;", "&") // Replace HTML entities for ampersands
          .replaceAll("&lt;", "<") // Replace HTML entities for less than
          .replaceAll("&gt;", ">") // Replace HTML entities for greater than
          .replaceAll("`", "") // Remove any remaining backticks to avoid SQL syntax issues
          .replaceAll("\r\n", " ") // Replace Windows line endings
          .replaceAll("\n", " ") // Replace Unix line endings
          .replaceAll("\r", " ") // Replace Mac line endings
          .replaceAll(/\s+/g, " ") // Collapse multiple spaces
          .replace(/\.\s*\.\s*/, ". ") // Fix double periods
          .replace(/\s+;$/, ";") // Ensure proper semicolon at end
          .trim()
          .replace(/([^;])$/, "$1;"); // Add semicolon if missing

      // Extract and sanitize COMMENT statements to fix HTML entities
      let tableMatch;
      while ((tableMatch = tableCommentRegex.exec(fullSchema)) !== null) {
        const comment = tableMatch[0];
        if (
          !_usedComments.has(comment) &&
          !comment.includes("\\&quot;") &&
          !comment.includes('\\"') &&
          comment.trim().endsWith(";")
        ) {
          const sanitizedComment = _sanitizeComment(comment);
          coreSchema += `${sanitizedComment}\n`;
          _usedComments.add(comment);
        }
      }

      let columnMatch;
      while ((columnMatch = columnCommentRegex.exec(fullSchema)) !== null) {
        const comment = columnMatch[0];
        if (
          !_usedComments.has(comment) &&
          !comment.includes("\\&quot;") &&
          !comment.includes('\\"') &&
          comment.trim().endsWith(";")
        ) {
          const sanitizedComment = _sanitizeComment(comment);
          coreSchema += `${sanitizedComment}\n`;
          _usedComments.add(comment);
        }
      }
      coreSchema += "\n";
    }
  }

  // Grant table/sequence access to the Supabase API roles. This local stack
  // does not otherwise set default privileges for tables created by these
  // migrations, so without this block every anon/authenticated/service_role
  // request 42501s with "permission denied" against every core table.
  coreSchema += `-- Grant API role access (RLS is currently disabled; see CLAUDE.md)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
`;

  // Write the clean schema
  writeFileSync(migrationPath, coreSchema);
}

// Run the extraction when script is executed directly
extractCoreSchema();
