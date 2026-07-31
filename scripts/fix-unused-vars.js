/**
 * Script to help fix unused variables by prefixing with underscore
 * This handles common patterns like error handlers and destructured values
 */

const fs = require("node:fs");
const path = require("node:path");

// Common patterns to fix
const patterns = [
  // Catch block errors: } catch (error) { -> } catch (_error) {
  {
    regex: /} catch \((error|err|e)\) {/g,
    replacement: "} catch (_$1) {",
  },
  // Error parameters in callbacks: .catch((error) => -> .catch((_error) =>
  {
    regex: /\.catch\(\((error|err|e)\)\s*=>/g,
    replacement: ".catch((_$1) =>",
  },
  // Unused destructured params in callbacks
  {
    regex:
      /\(([a-zA-Z_][a-zA-Z0-9_]*),\s*([a-zA-Z_][a-zA-Z0-9_]*)\)\s*=>\s*{[^}]*\b\2\b[^}]*}/g,
    check: (match, p1, p2) =>
      // Only replace if p1 is not used in the function body
      !match.includes(p1) && match.includes(p2),
    replacement: "(_$1, $2) => {",
  },
];

function processFile(filePath) {
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, "utf-8");
    let isModified = false;

    for (const pattern of patterns) {
      const before = content;
      if (pattern.check) {
        // Complex pattern with check function
        content = content.replace(pattern.regex, (match, ...arguments_) => {
          if (pattern.check(match, ...arguments_)) {
            isModified = true;
            return match.replace(pattern.regex, pattern.replacement);
          }
          return match;
        });
      } else {
        // Simple replacement
        content = content.replace(pattern.regex, pattern.replacement);
      }

      if (before !== content) {
        isModified = true;
      }
    }

    if (isModified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      processFile(fullPath);
    }
  });
}

// Main execution
const targetDirectories = [
  "issuer-portal/components",
  "issuer-portal/hooks",
  "issuer-portal/contexts",
  "issuer-portal/domain-models",
  "mock-api-server/domain-models",
];

console.log("🔧 Fixing unused variables by prefixing with underscore...\n");

for (const dir of targetDirectories) {
  const fullPath = path.join(__dirname, "..", dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing ${dir}...`);
    processDirectory(fullPath);
  }
}

console.log('\n✨ Done! Run "npm run lint" to see remaining warnings.');
