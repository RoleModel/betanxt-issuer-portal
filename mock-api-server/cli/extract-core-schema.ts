#!/usr/bin/env tsx
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  existingFiles.forEach((file) => {
    // Remove old initial schema migrations
    if (/^\d{14}_initial_schema\.sql$/.exec(file)) {
      unlinkSync(join(migrationsDir, file));
    }
  });

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
  const SKIP_TYPES: string[] = [];

  const enumMatches = fullSchema.match(/CREATE TYPE[^;]+;/g) || [];
  enumMatches.forEach((enumDef) => {
    // Extract type name
    const typeNameMatch = /CREATE TYPE (\w+)/.exec(enumDef);
    if (typeNameMatch) {
      const typeName = typeNameMatch[1];

      // Skip types that are managed by other migrations
      if (SKIP_TYPES.includes(typeName)) {
        return;
      }

      // Add DROP IF EXISTS with CASCADE for types that might have dependencies
      coreSchema += `DROP TYPE IF EXISTS ${typeName} CASCADE;\n`;
    }
    coreSchema += enumDef + "\n\n";
  });

  // Extract core table definitions and their comments
  const _usedComments = new Set();

  CORE_TABLES.forEach((tableName) => {
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
        (match, schema, tableName) => {
          return `DROP TABLE IF EXISTS ${schema ?? ""}${tableName} CASCADE;\nCREATE TABLE ${schema ?? ""}${tableName}`;
        }
      );

      coreSchema += tableSection + "\n";

      // Add COMMENT statements for this table only (exact matches only)
      const escapedTableName = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
      const _sanitizeComment = (_comment: string): string => {
        return _comment
          .replace(/&#x60;/g, "") // Remove HTML encoded backticks entirely
          .replace(/&#x27;/g, "'") // Replace HTML encoded single quotes (hex format)
          .replace(/&#39;/g, "'") // Replace HTML encoded single quotes (decimal format)
          .replace(/&quot;/g, '"') // Replace HTML entities for double quotes
          .replace(/&amp;/g, "&") // Replace HTML entities for ampersands
          .replace(/&lt;/g, "<") // Replace HTML entities for less than
          .replace(/&gt;/g, ">") // Replace HTML entities for greater than
          .replace(/`/g, "") // Remove any remaining backticks to avoid SQL syntax issues
          .replace(/\r\n/g, " ") // Replace Windows line endings
          .replace(/\n/g, " ") // Replace Unix line endings
          .replace(/\r/g, " ") // Replace Mac line endings
          .replace(/\s+/g, " ") // Collapse multiple spaces
          .replace(/\.\s*\.\s*/, ". ") // Fix double periods
          .replace(/\s+;$/, ";") // Ensure proper semicolon at end
          .trim()
          .replace(/([^;])$/, "$1;"); // Add semicolon if missing
      };

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
          coreSchema += sanitizedComment + "\n";
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
          coreSchema += sanitizedComment + "\n";
          _usedComments.add(comment);
        }
      }
      coreSchema += "\n";
    }
  });

  // Write the clean schema
  writeFileSync(migrationPath, coreSchema);
}

// Run the extraction when script is executed directly
extractCoreSchema();
