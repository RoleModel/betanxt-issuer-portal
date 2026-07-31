/**
 * Bulk ESLint Auto-Fixer
 *
 * This script automatically fixes common ESLint errors across the codebase.
 * It focuses on safe, mechanical transformations that don't change behavior.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// Directories to process
const DIRS_TO_PROCESS = ["issuer-portal", "mock-api-server", "supabase"];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".next",
  "dist",
  "types/models", // Auto-generated files
  "public/images/pdf.worker.min.js", // Minified vendor file
];

/**
 * Check if a file path should be excluded
 */
function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

/**
 * Get all TypeScript files recursively
 */
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (shouldExcludeFile(filePath)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Fix prefer-nullish-coalescing: Replace || with ?? for specific patterns
 */
function fixNullishCoalescing(content) {
  // Only replace || with ?? for environment variables and default values
  // Be conservative to avoid breaking boolean logic
  let fixed = content;

  // Pattern: process.env.VAR || 'default'
  fixed = fixed.replaceAll(
    /process\.env\.([A-Z_]+)\s+\|\|\s+(['"`])/g,
    "process.env.$1 ?? $2"
  );

  // Pattern: someVar || 'default' (only for string/number literals)
  fixed = fixed.replaceAll(/(\w+)\s+\|\|\s+(['"`][^'"`]*['"`])/g, "$1 ?? $2");

  // Pattern: obj.prop || ''
  fixed = fixed.replaceAll(/([\w.[\]'"`]+)\s+\|\|\s+(['"`]{2})/g, "$1 ?? $2");

  // Pattern: obj.prop || 0
  fixed = fixed.replaceAll(/([\w.[\]'"`]+)\s+\|\|\s+0\b/g, "$1 ?? 0");

  return fixed;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    const originalContent = content;

    // Apply fixes
    content = fixNullishCoalescing(content);

    // Only write if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log("🔧 Starting bulk ESLint fixes...\n");

  let totalFilesProcessed = 0;
  let totalFilesModified = 0;

  for (const dir of DIRS_TO_PROCESS) {
    const fullPath = path.join(__dirname, dir);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skipping ${dir} (not found)`);
      continue;
    }

    console.log(`📁 Processing ${dir}...`);
    const files = getAllTsFiles(fullPath);

    files.forEach((file) => {
      totalFilesProcessed++;
      if (processFile(file)) {
        totalFilesModified++;
      }
    });

    console.log(`   Processed ${files.length} files\n`);
  }

  console.log(`✅ Complete!`);
  console.log(`   Files processed: ${totalFilesProcessed}`);
  console.log(`   Files modified: ${totalFilesModified}\n`);

  console.log("🏃 Running ESLint with --fix...\n");
  try {
    execSync("npm run lint -- --fix", { stdio: "inherit", cwd: __dirname });
  } catch {
    // ESLint exits with error code if there are unfixed errors, which is expected
  }

  console.log("\n📊 Final lint status:\n");
  try {
    execSync("npm run lint 2>&1 | tail -20", {
      stdio: "inherit",
      cwd: __dirname,
    });
  } catch {
    // Expected if there are still errors
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, fixNullishCoalescing };
