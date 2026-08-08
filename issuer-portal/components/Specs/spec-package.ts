/**
 * The one description of a spec package that every shared piece reads.
 *
 * @remarks
 * Each package under `app/specs/` owns its content — requirements, code
 * samples, affected files — and nothing else. Everything that used to be copied
 * alongside that content (the page, the source collector, the Markdown writer)
 * now lives in `components/Specs/` and takes a `SpecPackage`, so a change to how
 * specs render or download happens in one place.
 *
 * Where packages genuinely differ, the difference is a field here rather than a
 * fork: the archive folder the code samples land in, the copy in the archive's
 * README, the download filename, and whether samples are labelled as built.
 *
 * The content shapes are defined by the UI-enhancements package, which was the
 * first spec written, and are re-exported here so a shared component never has
 * to reach into a particular package for a type.
 */

import type {
  ScreenLink,
  SpecMeta,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

import type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";

export type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";
export type {
  Requirement,
  ScreenLink,
  SpecMeta,
  SpecSection,
  SpecTable,
  Topic,
} from "@/app/specs/ui-enhancements/requirements";

/** One folder of the download: real source files, grouped by what they do. */
export interface AffectedGroup {
  /** Folder inside the zip. */
  readonly folder: string;
  readonly label: string;
  /** Repo-relative paths from `issuer-portal/`. */
  readonly paths: readonly string[];
  /** Which spec section this group belongs to. */
  readonly sectionId: string;
}

/** Where each source file is visible in the running app, keyed by path. */
export type ScreenLinkMap = Readonly<Record<string, readonly ScreenLink[]>>;

/**
 * What goes into the download, and how its README describes it.
 *
 * @remarks
 * The prose fields exist because each package's archive explains itself
 * differently — one is a sample of a nineteen-chart directory, another is one
 * file per idea out of seventy-four. They are lists of lines rather than
 * paragraphs so the README stays inside a comfortable width without the writer
 * counting characters: the first line follows the bullet, the rest are indented
 * under it.
 */
export interface SpecArchive {
  /** Folder holding the spec page's code samples, e.g. `reference`. */
  readonly codeFolder: string;
  /** How the code folder's README bullet reads, one entry per line. */
  readonly codeSummary?: readonly string[];
  /** How the `current/` README bullet reads, one entry per line. */
  readonly currentSummary?: readonly string[];
  /** The source files to collect. */
  readonly groups: readonly AffectedGroup[];
  /** How `current/` paths map back to the repo, one entry per line. */
  readonly pathNote?: readonly string[];
}

/** Everything the shared page and downloads need from one spec package. */
export interface SpecPackage {
  /** One-line description under the metadata table in the Markdown download. */
  readonly abstract: string;
  readonly archive: SpecArchive;
  readonly codeSamples: readonly CodeSample[];
  /**
   * Hides the chip row under each code sample.
   *
   * @remarks
   * A package whose samples are abridgements of shipping code rather than
   * proposals gains nothing from per-sample requirement links, because the
   * requirements already name the files.
   */
  readonly hidesCodeChips?: boolean;
  readonly meta: SpecMeta;
  readonly screenLinks: ScreenLinkMap;
  readonly sections: readonly SpecSection[];
  /** Labels each code sample as built or proposed, from its `asBuilt` field. */
  readonly showsAsBuilt?: boolean;
  /** Names the downloads: `issuer-portal-{slug}-v{version}.zip`. */
  readonly slug: string;
}

/**
 * The code samples belonging to one section, in the order they are declared.
 *
 * @param spec - The package being rendered or serialised.
 * @param sectionId - The section to collect for.
 * @returns Its samples.
 */
export const samplesForSection = (
  spec: SpecPackage,
  sectionId: string
): readonly CodeSample[] =>
  spec.codeSamples.filter((sample) => sample.sectionId === sectionId);

/**
 * The screens a scope answer covers, derived from its requirements.
 *
 * @param spec - The package being rendered.
 * @param requirementIds - Requirements the answer points at.
 * @returns Their screens, deduplicated by address and label.
 *
 * @remarks
 * Derived rather than hand-authored so an answer can never claim a screen its
 * own requirements do not mention.
 */
export const screensForRequirements = (
  spec: SpecPackage,
  requirementIds: readonly string[]
): readonly ScreenLink[] => {
  const screens = spec.sections
    .flatMap((section) => section.requirements)
    .filter((requirement) => requirementIds.includes(requirement.id))
    .flatMap((requirement) => requirement.screens);

  const seen = new Map<string, ScreenLink>(
    screens.map((screen) => [`${screen.href}${screen.label}`, screen])
  );

  return [...seen.values()];
};

/** How many source files the download collects. */
export const affectedFileCount = (spec: SpecPackage): number =>
  spec.archive.groups.reduce((total, group) => total + group.paths.length, 0);

/** Basename shared by both downloads, version included. */
export const downloadBaseName = (spec: SpecPackage): string =>
  `issuer-portal-${spec.slug}-v${spec.meta.version}`;
