#!/usr/bin/env tsx
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Extract only core data model tables from the generated PostgreSQL schema
 * This excludes request/response schemas and focuses on actual data models
 */

const CORE_TABLES = [
  'clients',
  'account',
  'user',
  'meeting',
  'phase',
  'task',
  'document',
  'comment',
  'signature',
  'position',
  'position_vote',
  'proposal',
  'notification',
]

function extractCoreSchema() {
  const migrationsDir = join(__dirname, '../../supabase/migrations')
  const schemaPath = join(__dirname, '../../supabase/migrations/postgresql_schema.sql')

  // Read the schema file
  let fullSchema = ''
  try {
    fullSchema = readFileSync(schemaPath, 'utf-8')
  } catch (error) {
    console.error('Error reading postgresql_schema.sql:', error)
    process.exit(1)
  }

  // Clean up old generated files
  const existingFiles = readdirSync(migrationsDir)
  existingFiles.forEach((file) => {
    // Remove old initial schema migrations
    if (file.match(/^\d{14}_initial_schema\.sql$/)) {
      unlinkSync(join(migrationsDir, file))
      console.log(`🗑️  Removed old migration: ${file}`)
    }
  })

  // Generate timestamp for migration filename (YYYYMMDDHHMMSS format)
  const now = new Date()
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')

  const migrationPath = join(
    __dirname,
    `../../supabase/migrations/${timestamp}_initial_schema.sql`
  )

  let coreSchema = `-- BetaNXT Issuer Portal Database Schema
-- Generated from OpenAPI specification (core data models only)
-- Date: ${new Date().toISOString()}

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types first
`

  // Extract enum definitions first
  const enumMatches = fullSchema.match(/CREATE TYPE[^;]+;/g) || []
  enumMatches.forEach((enumDef) => {
    // Extract type name and add DROP IF EXISTS first
    const typeNameMatch = enumDef.match(/CREATE TYPE (\w+)/)
    if (typeNameMatch) {
      const typeName = typeNameMatch[1]
      coreSchema += `DROP TYPE IF EXISTS ${typeName};\n`
    }
    coreSchema += enumDef + '\n\n'
  })

  // Extract core table definitions and their comments
  const usedComments = new Set()

  CORE_TABLES.forEach((tableName) => {
    // Look for the table definition including its full structure
    const tableStartRegex = new RegExp(
      `-- Table '${tableName}'.*?CREATE TABLE[^;]*?\\);`,
      'gs'
    )
    const matches = fullSchema.match(tableStartRegex)

    if (matches && matches[0]) {
      const tableSection = matches[0]
      coreSchema += tableSection + '\n'

      // Add COMMENT statements for this table only (exact matches only)
      const escapedTableName = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const tableCommentRegex = new RegExp(
        `COMMENT ON TABLE (?:public\\.)?(?:")?${escapedTableName}(?:")?\\b[^;]*?;`,
        'g'
      )
      const columnCommentRegex = new RegExp(
        `COMMENT ON COLUMN (?:public\\.)?(?:")?${escapedTableName}(?:")?\\.[^;]*?;`,
        'g'
      )

      // Reset regex state for global search
      tableCommentRegex.lastIndex = 0
      columnCommentRegex.lastIndex = 0

      let tableMatch
      while ((tableMatch = tableCommentRegex.exec(fullSchema)) !== null) {
        const comment = tableMatch[0]
        if (
          !usedComments.has(comment) &&
          !comment.includes('\\&quot;') &&
          !comment.includes('\\"') &&
          comment.trim().endsWith(';')
        ) {
          coreSchema += comment + '\n'
          usedComments.add(comment)
        }
      }

      let columnMatch
      while ((columnMatch = columnCommentRegex.exec(fullSchema)) !== null) {
        const comment = columnMatch[0]
        if (
          !usedComments.has(comment) &&
          !comment.includes('\\&quot;') &&
          !comment.includes('\\"') &&
          comment.trim().endsWith(';')
        ) {
          coreSchema += comment + '\n'
          usedComments.add(comment)
        }
      }

      coreSchema += '\n'
    } else {
      console.warn(`⚠️ Table '${tableName}' not found in schema`)
    }
  })

  // Write the clean schema
  writeFileSync(migrationPath, coreSchema)
  console.log(`✅ Core schema extracted to ${migrationPath}`)
  console.log(`📊 Included ${CORE_TABLES.length} core tables`)
}

// Run the extraction when script is executed directly
extractCoreSchema()
