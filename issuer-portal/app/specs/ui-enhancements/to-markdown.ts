import type {
  Requirement,
  SpecTable,
} from "@/app/specs/ui-enhancements/requirements";

import { CODE_SAMPLES } from "@/app/specs/ui-enhancements/code-samples";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/ui-enhancements/requirements";

/**
 * Serialises the spec to Markdown for download.
 *
 * @remarks
 * The download and the page render from the same typed source, so the file a
 * stakeholder mails around cannot drift from the page a developer reads. That
 * is the entire reason the requirements live in a module instead of in JSX.
 */

/**
 * Renders one requirement as a Markdown block.
 *
 * @param requirement - The requirement to serialise.
 * @returns Markdown lines, already joined.
 */
const requirementToMarkdown = (requirement: Requirement): string => {
  const lines = [
    `#### ${requirement.id} — ${requirement.title}`,
    "",
    requirement.statement,
    "",
  ];

  if (requirement.rationale !== undefined) {
    lines.push(`> **Why:** ${requirement.rationale}`, "");
  }

  lines.push("**Acceptance criteria**", "");

  for (const criterion of requirement.acceptance) {
    lines.push(`- ${criterion}`);
  }

  lines.push("");

  if (requirement.evidence !== undefined && requirement.evidence.length > 0) {
    lines.push(
      `**In the code:** ${requirement.evidence
        .map((path) => `\`${path}\``)
        .join(", ")}`,
      ""
    );
  }

  return lines.join("\n");
};

/**
 * Renders a table, padding nothing — Markdown renderers handle alignment.
 */
const tableToMarkdown = (table: SpecTable): string => {
  const lines = [`##### ${table.title}`, ""];

  if (table.caption !== undefined) {
    lines.push(`_${table.caption}_`, "");
  }

  lines.push(
    `| ${table.headers.join(" | ")} |`,
    `| ${table.headers.map(() => "---").join(" | ")} |`
  );

  for (const row of table.rows) {
    lines.push(
      `| ${row.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`
    );
  }

  lines.push("");

  return lines.join("\n");
};

/**
 * Builds the complete requirements document.
 *
 * @param generatedOn - Date stamp for the header, passed in so the function
 * stays pure and the same input always produces the same file.
 * @returns The full Markdown document.
 */
export const buildSpecMarkdown = (generatedOn: string): string => {
  const lines = [
    `# ${SPEC_META.title}`,
    "",
    `| | |`,
    `| --- | --- |`,
    `| Version | ${SPEC_META.version} |`,
    `| Status | ${SPEC_META.status} |`,
    `| Audience | ${SPEC_META.audience} |`,
    `| Repository | ${SPEC_META.repository} |`,
    `| Generated | ${generatedOn} |`,
    "",
    "Requirements for three UI enhancements: a percentage/count display toggle, tooltip and glossary navigation, and glossary formatting.",
    "",
    "## Contents",
    "",
  ];

  for (const section of SPEC_SECTIONS) {
    lines.push(`- **${section.title}** — ${section.summary}`);
  }

  lines.push("");

  for (const section of SPEC_SECTIONS) {
    lines.push(`## ${section.title}`, "");

    for (const paragraph of section.background) {
      lines.push(paragraph, "");
    }

    if (section.topics !== undefined) {
      lines.push("### Scope", "");

      for (const topic of section.topics) {
        if (topic.lead !== undefined) {
          lines.push(topic.lead, "");
        }

        lines.push(`**${topic.question}**`, "");

        for (const paragraph of topic.answer) {
          lines.push(paragraph, "");
        }

        lines.push(`_See ${topic.requirementIds.join(", ")}._`, "");
      }
    }

    lines.push("### Requirements", "");

    for (const requirement of section.requirements) {
      lines.push(requirementToMarkdown(requirement));
    }

    if (section.tables !== undefined) {
      lines.push("### Reference tables", "");

      for (const table of section.tables) {
        lines.push(tableToMarkdown(table));
      }
    }

    const samples = CODE_SAMPLES.filter(
      (sample) => sample.sectionId === section.id
    );

    if (samples.length > 0) {
      lines.push("### Reference implementations", "");

      for (const sample of samples) {
        lines.push(
          `#### \`${sample.filename}\` — ${sample.title}`,
          "",
          `Satisfies ${sample.satisfies.join(", ")}.`,
          "",
          "```" + sample.language,
          sample.code.trimEnd(),
          "```",
          ""
        );
      }
    }
  }

  return lines.join("\n");
};
