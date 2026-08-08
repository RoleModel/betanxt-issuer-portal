import type {
  CodeSample,
  Requirement,
  SpecPackage,
  SpecSection,
  SpecTable,
  Topic,
} from "@/components/Specs/spec-package";

import { samplesForSection } from "@/components/Specs/spec-package";

/**
 * Serialises a spec to Markdown for download.
 *
 * @remarks
 * The download and the page render from the same typed source, so the file a
 * stakeholder mails around cannot drift from the page a developer reads. That
 * is the entire reason the requirements live in a module instead of in JSX.
 *
 * One writer serves every package: the only per-package differences are the
 * one-line abstract under the metadata table and whether samples carry an
 * as-built line, and both come from the `SpecPackage`.
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

/** Renders one scope question and its answer. */
const topicToMarkdown = (topic: Topic): readonly string[] => {
  const lines: string[] = [];

  if (topic.lead !== undefined) {
    lines.push(topic.lead, "");
  }

  lines.push(`**${topic.question}**`, "");

  for (const paragraph of topic.answer) {
    lines.push(paragraph, "");
  }

  lines.push(`_See ${topic.requirementIds.join(", ")}._`, "");

  return lines;
};

/**
 * Renders one code sample as a fenced block.
 *
 * @param spec - The package being serialised, which decides whether the block
 * says if it is shipping code or a proposal.
 * @param sample - The sample to serialise.
 * @returns The sample's lines.
 */
const sampleToMarkdown = (
  spec: SpecPackage,
  sample: CodeSample
): readonly string[] => {
  const lines = [`#### \`${sample.filename}\` — ${sample.title}`, ""];

  if (spec.showsAsBuilt === true) {
    lines.push(
      sample.asBuilt === true
        ? "As built — abridged from shipping code."
        : "As built, followed by the proposed change.",
      ""
    );
  }

  lines.push(
    `Satisfies ${sample.satisfies.join(", ")}.`,
    "",
    `\`\`\`${sample.language}`,
    sample.code.trimEnd(),
    "```",
    ""
  );

  return lines;
};

/** Renders one section: background, scope, requirements, tables, code. */
const sectionToMarkdown = (
  spec: SpecPackage,
  section: SpecSection
): readonly string[] => {
  const lines: string[] = [`## ${section.title}`, ""];

  for (const paragraph of section.background) {
    lines.push(paragraph, "");
  }

  if (section.topics !== undefined) {
    lines.push("### Scope", "");

    for (const topic of section.topics) {
      lines.push(...topicToMarkdown(topic));
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

  const samples = samplesForSection(spec, section.id);

  if (samples.length > 0) {
    lines.push("### Reference implementations", "");

    for (const sample of samples) {
      lines.push(...sampleToMarkdown(spec, sample));
    }
  }

  return lines;
};

/**
 * Builds the complete requirements document.
 *
 * @param spec - The package to serialise.
 * @param generatedOn - Date stamp for the header, passed in so the function
 * stays pure and the same input always produces the same file.
 * @returns The full Markdown document.
 */
export const buildSpecMarkdown = (
  spec: SpecPackage,
  generatedOn: string
): string => {
  const lines = [
    `# ${spec.meta.title}`,
    "",
    `| | |`,
    `| --- | --- |`,
    `| Version | ${spec.meta.version} |`,
    `| Status | ${spec.meta.status} |`,
    `| Audience | ${spec.meta.audience} |`,
    `| Repository | ${spec.meta.repository} |`,
    `| Generated | ${generatedOn} |`,
    "",
    spec.abstract,
    "",
    "## Contents",
    "",
  ];

  for (const section of spec.sections) {
    lines.push(`- **${section.title}** — ${section.summary}`);
  }

  lines.push("");

  for (const section of spec.sections) {
    lines.push(...sectionToMarkdown(spec, section));
  }

  return lines.join("\n");
};
