/**
 * Extract WCAG criteria from axe-core tags
 * Converts tags like 'wcag2a', 'wcag111', 'wcag21a' to readable format
 */
export function extractWcagCriteria(tags: string[]): string {
  const wcagTags = tags.filter((tag) => tag.startsWith("wcag"));

  if (wcagTags.length === 0) {
    return "No WCAG criteria mapped";
  }

  const criteria: string[] = [];

  for (const tag of wcagTags) {
    // Remove 'wcag' prefix
    const value = tag.replace(/^wcag/, "");

    // Skip level tags (2a, 21a, 22aa, etc)
    if (/^2+[1-2]*a+$/i.test(value)) {
      continue;
    }

    // Convert number format to dotted format
    // e.g., '111' -> '1.1.1', '413' -> '4.1.3'
    const digits = /\d+/.exec(value)?.[0] ?? "";
    if (digits.length >= 3) {
      const formatted = digits.split("").join(".");
      criteria.push(formatted);
    }
  }

  return criteria.length > 0 ? criteria.join(", ") : "No WCAG criteria mapped";
}
