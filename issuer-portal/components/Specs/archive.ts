import type { SpecArchive } from "@/components/Specs/spec-package";
import type { ZipEntry } from "@/components/Specs/zip";

/**
 * Pulls the app's real source files for a spec's download.
 *
 * @remarks
 * The files come from `/api/dev/source`, the route the developer overlay
 * already uses to show a component its own code. It reads the working tree
 * under `next dev` and a build-time snapshot on a deployment, so this page gets
 * accurate source in both without a second copy of the tree and without any
 * filesystem access of its own.
 *
 * That route is gated on the dev-overlay flag and returns 404 when it is off,
 * so a miss is expected rather than exceptional. Misses are collected and
 * written into the archive's manifest instead of failing the download — a
 * partial package with an honest list of what is missing is more useful than
 * no package.
 *
 * One implementation serves every spec package: what differs between them is
 * which files to collect and how the README describes them, and both arrive as
 * a `SpecArchive`.
 */

export interface CollectedSources {
  readonly entries: readonly ZipEntry[];
  /** Paths the source route would not return, with the reason. */
  readonly missing: readonly {
    readonly path: string;
    readonly reason: string;
  }[];
}

const hasSourceString = (value: unknown): value is { source: string } =>
  typeof value === "object" &&
  value !== null &&
  "source" in value &&
  typeof value.source === "string";

const requestFailedReason = (error: unknown): { reason: string } => ({
  reason: Error.isError(error) ? error.message : "request failed",
});

/**
 * Fetches one file's source.
 *
 * @param path - Repo-relative path from `issuer-portal/`.
 * @returns The file's text, or a reason it could not be read.
 *
 * @remarks
 * Each `try` holds nothing but the await it is guarding. The branching on the
 * response sits outside, which keeps every failure path visible at the top
 * level of the function rather than buried in a block whose `catch` would
 * silently swallow a mistake in the branching itself.
 */
const fetchSource = async (
  path: string
): Promise<{ source: string } | { reason: string }> => {
  let response: Response;

  try {
    // eslint-disable-next-line compat/compat -- Opera Mini is not a target; fetch is available in every browser this app supports.
    response = await fetch(`/api/dev/source?path=${encodeURIComponent(path)}`, {
      headers: { accept: "application/json" },
    });
  } catch (error) {
    return requestFailedReason(error);
  }

  if (!response.ok) {
    return {
      reason:
        response.status === 404
          ? "not found, or the dev overlay is switched off for this deployment"
          : `source route returned ${response.status}`,
    };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (error) {
    return requestFailedReason(error);
  }

  return hasSourceString(body)
    ? { source: body.source }
    : { reason: "source route returned no content" };
};

/**
 * Fetches every affected file, in parallel, tolerating failures.
 *
 * @param archive - The spec's archive description.
 * @returns Zip entries for what came back, and a list of what did not.
 *
 * @remarks
 * `Promise.all` over roughly seventy small same-origin requests is fine here —
 * the browser caps concurrency itself, and the alternative (sequential fetches)
 * would make the download button feel broken for several seconds.
 */
export const collectAffectedSources = async (
  archive: SpecArchive
): Promise<CollectedSources> => {
  const entries: ZipEntry[] = [];
  const missing: { path: string; reason: string }[] = [];

  const results = await Promise.all(
    archive.groups.flatMap((group) =>
      group.paths.map(async (path) => ({
        folder: group.folder,
        path,
        result: await fetchSource(path),
      }))
    )
  );

  for (const { folder, path, result } of results) {
    if ("source" in result) {
      entries.push({ contents: result.source, path: `${folder}/${path}` });
    } else {
      missing.push({ path, reason: result.reason });
    }
  }

  return { entries, missing };
};

/** The default `current/` description, used unless a package overrides it. */
const CURRENT_SUMMARY: readonly string[] = [
  "a sample of the app's source as it is today, grouped by",
  "what it does.",
];

/** The default description of the code-sample folder. */
const CODE_SUMMARY: readonly string[] = [
  "the reference code from the spec page.",
];

/** The default note on how archive paths map back to the repository. */
const PATH_NOTE: readonly string[] = [
  "Paths under `current/` mirror `issuer-portal/`.",
];

/**
 * Renders one README bullet: `- \`folder/\` — first line`, rest indented.
 *
 * @param folder - Folder the bullet describes.
 * @param summary - Its description, one entry per line.
 * @returns The bullet's lines.
 */
const folderBullet = (
  folder: string,
  summary: readonly string[]
): readonly string[] => [
  `- \`${folder}/\` — ${summary[0]}`,
  ...summary.slice(1).map((line) => `  ${line}`),
];

/**
 * Builds the archive's README.
 *
 * @param archive - The spec's archive description.
 * @param missing - Anything the source route would not return.
 * @param codeCount - How many code samples are in the archive.
 * @returns Markdown describing the archive's layout.
 *
 * @remarks
 * States the misses plainly, and says outright that `current/` is a sample.
 * An archive that quietly omits files reads as complete, and someone
 * estimating from it would be estimating from a subset without knowing.
 */
export const buildManifest = (
  archive: SpecArchive,
  missing: CollectedSources["missing"],
  codeCount: number
): string => {
  const lines = [
    "# What is in this archive",
    "",
    "- `REQUIREMENTS.md` — the full requirements document.",
    ...folderBullet("current", archive.currentSummary ?? CURRENT_SUMMARY),
    ...folderBullet(archive.codeFolder, archive.codeSummary ?? CODE_SUMMARY),
    "",
    ...(archive.pathNote ?? PATH_NOTE),
    "",
    `${codeCount} ${archive.codeFolder} files are included.`,
    "",
  ];

  if (missing.length === 0) {
    lines.push("Every listed source file was included.", "");

    return lines.join("\n");
  }

  lines.push(
    `## ${missing.length} file(s) could not be included`,
    "",
    "The source route is switched off outside development. Set",
    "`NEXT_PUBLIC_ENABLE_DEV_OVERLAY=true`, or run the app locally, and",
    "download again to get these.",
    "",
    "| File | Reason |",
    "| --- | --- |"
  );

  for (const item of missing) {
    lines.push(`| \`${item.path}\` | ${item.reason} |`);
  }

  lines.push("");

  return lines.join("\n");
};
