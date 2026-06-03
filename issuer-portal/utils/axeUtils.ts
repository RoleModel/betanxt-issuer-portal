// Utility to generate axe rules data at build time
import axe from "axe-core";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

export function generateAxeRulesData() {
  try {
    // Get all axe rules
    const rules = axe.getRules();

    const rulesData = rules.map((rule) => ({
      ruleId: rule.ruleId,
      description: rule.description,
      help: rule.help,
      helpUrl: rule.helpUrl,
      tags: rule.tags,
    }));

    // Ensure directory exists
    const dataDir = join(process.cwd(), "public", "data");
    mkdirSync(dataDir, { recursive: true });

    // Write rules data
    const rulesFilePath = join(dataDir, "axe-rules.json");
    writeFileSync(rulesFilePath, JSON.stringify(rulesData, null, 2));

    return rulesData;
  } catch (error) {
    console.error("Failed to generate axe rules data:", error);
    return [];
  }
}

// Generate the data when this module is imported
if (typeof window === "undefined") {
  generateAxeRulesData();
}
