"use client";

import type { ReactNode } from "react";

import type { GlossaryTermId } from "@/contexts/GlossaryContext";

import { GlossaryTooltip } from "@/components/ui/GlossaryToolTip";
import { termsDefinitions } from "@/lib/termsDefinitions";

/**
 * Wraps every glossary term inside a piece of copy, leaving the rest as text.
 *
 * @remarks
 * Most glossary terms appear inside a longer label — "Quorum requirement: 50%",
 * "Broker Search Date", "Shares Listed In Proxy Statement" — so marking them up
 * by hand would mean splitting strings at every call site and keeping those
 * splits correct as copy changes. This does the splitting from the glossary
 * itself, which means a term added to `termsDefinitions` becomes linked
 * everywhere this component is already used, with no follow-up edit.
 *
 * @example
 * ```tsx
 * <Typography>
 *   <GlossaryText>Votes represented for quorum</GlossaryText>
 * </Typography>
 * ```
 */

interface TermAlias {
  readonly alias: string;
  readonly id: GlossaryTermId;
}

/**
 * Searchable spellings for one glossary entry.
 *
 * @param term - The entry's display term, which may carry parentheticals.
 * @returns The term without its parentheticals, plus each acronym inside them.
 *
 * @remarks
 * Entries are titled for the glossary, not for prose: "Notice and Access (NAA)"
 * has to match both "Notice and Access" and a bare "NAA", and
 * "Cede and Company (aka Cede and Co. or Cede & Co.)" carries three more
 * spellings that all appear in real copy.
 */
const aliasesFor = (term: string): readonly string[] => {
  const found = new Set<string>();
  const withoutParentheticals = term.replaceAll(/\s*\([^)]*\)/gu, "").trim();

  if (withoutParentheticals.length > 0) {
    found.add(withoutParentheticals);
  }

  for (const [, inside] of term.matchAll(/\(([^)]+)\)/gu)) {
    for (const part of inside.split(/\s+or\s+|\s+aka\s+|,/u)) {
      const candidate = part.trim().replace(/\.$/u, "");
      if (candidate.length >= 3 && !candidate.toLowerCase().startsWith("aka")) {
        found.add(candidate);
      }
    }
  }

  return [...found].filter((candidate) => candidate.length >= 3);
};

/** Longest alias first, so "Proxy Statement" wins over a bare "Proxy". */
const termAliases: readonly TermAlias[] = Object.entries(termsDefinitions)
  .flatMap(([id, entry]) =>
    aliasesFor(entry.term).map(
      (alias): TermAlias => ({ alias, id: id as GlossaryTermId })
    )
  )
  .sort((first, second) => second.alias.length - first.alias.length);

const escapeForRegex = (value: string): string =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);

/**
 * One pattern for the whole glossary.
 *
 * @remarks
 * Alternation is ordered longest-first so the engine prefers the most specific
 * term at any position. The boundaries are letter-based rather than `\b`,
 * because several terms end in a character `\b` treats as a boundary — "Cede &
 * Co." and "NCOALink®" would otherwise match inside unrelated words.
 */
const glossaryPattern = new RegExp(
  `(?<![A-Za-z])(${termAliases
    .map((entry) => escapeForRegex(entry.alias))
    .join("|")})(?![A-Za-z])`,
  "giu"
);

const idForAlias = new Map<string, GlossaryTermId>(
  termAliases.map((entry) => [entry.alias.toLowerCase(), entry.id])
);

export interface GlossaryTextProps {
  /**
   * Plain copy to scan. Anything that is not a glossary term is untouched.
   *
   * @remarks
   * Nullable because most call sites pass a label off a record where it is
   * optional; requiring a string would push a `?? ""` into every one of them.
   */
  readonly children: string | null | undefined;
}

export const GlossaryText = ({ children }: GlossaryTextProps) => {
  if (children === null || children === undefined || children.length === 0) {
    return null;
  }

  const parts: ReactNode[] = [];
  // Only the first mention of a term in one label is linked. A heading that
  // says "quorum" twice does not need two dashed underlines to make the point.
  const linked = new Set<GlossaryTermId>();
  let lastIndex = 0;

  // Fresh lastIndex per render: the pattern is module-level and /g is stateful.
  glossaryPattern.lastIndex = 0;

  for (const match of children.matchAll(glossaryPattern)) {
    const matched = match[1];
    const id = matched === undefined ? undefined : idForAlias.get(matched.toLowerCase());

    if (matched === undefined || id === undefined || linked.has(id)) {
      continue;
    }

    linked.add(id);
    const start = match.index;

    if (start > lastIndex) {
      parts.push(children.slice(lastIndex, start));
    }

    parts.push(
      <GlossaryTooltip key={`${id}-${start}`} term={id}>
        {matched}
      </GlossaryTooltip>
    );
    lastIndex = start + matched.length;
  }

  if (parts.length === 0) {
    return children;
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return parts;
};

export default GlossaryText;
