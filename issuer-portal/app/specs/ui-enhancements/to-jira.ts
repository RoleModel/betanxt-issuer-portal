import type { Requirement } from "@/app/specs/ui-enhancements/requirements";

/**
 * Turns one requirement into a ticket that can be pasted straight into Jira.
 *
 * @remarks
 * Jira's editor accepts pasted plain text and keeps line breaks, so this stays
 * plain rather than using wiki markup — markup that the target project has
 * turned off arrives as literal asterisks, which is worse than no formatting.
 *
 * The requirement id leads the summary so tickets sort and search by it, and
 * the spec link closes the loop: whoever picks the ticket up can get back to
 * the surrounding context rather than working from the excerpt alone.
 */

/**
 * Builds the ticket text.
 *
 * @param requirement - The requirement to copy.
 * @param sectionTitle - Which section it came from, for context.
 * @param specUrl - Absolute link back to this requirement on the spec page.
 * @returns Summary line followed by a description.
 */
export const buildJiraTicket = (
  requirement: Requirement,
  sectionTitle: string,
  specUrl: string
): string => {
  const lines = [
    `${requirement.id} — ${requirement.title}`,
    "",
    requirement.statement,
    "",
  ];

  if (requirement.rationale !== undefined) {
    lines.push(`Why: ${requirement.rationale}`, "");
  }

  lines.push("Acceptance criteria:");

  for (const criterion of requirement.acceptance) {
    lines.push(`- ${criterion}`);
  }

  lines.push("");

  if (requirement.evidence !== undefined && requirement.evidence.length > 0) {
    lines.push("In the code:");

    for (const path of requirement.evidence) {
      lines.push(`- ${path}`);
    }

    lines.push("");
  }

  lines.push(`Section: ${sectionTitle}`, `Spec: ${specUrl}`);

  return lines.join("\n");
};
