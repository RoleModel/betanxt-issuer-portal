import type { ZipEntry } from "@/components/Specs/zip";
import { AFFECTED_GROUPS } from "@/app/specs/ui-enhancements/affected-files";

/**
 * Pulls the app's real source files for the download.
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

/**
 * Fetches one file's source.
 *
 * @param path - Repo-relative path from `issuer-portal/`.
 * @returns The file's text, or a reason it could not be read.
 */
const requestFailedReason = (error: unknown): { reason: string } => ({
  reason: Error.isError(error) ? error.message : "request failed",
});

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
 * @returns Zip entries for what came back, and a list of what did not.
 *
 * @remarks
 * `Promise.all` over roughly seventy small same-origin requests is fine here —
 * the browser caps concurrency itself, and the alternative (sequential fetches)
 * would make the download button feel broken for several seconds.
 */
export const collectAffectedSources = async (): Promise<CollectedSources> => {
  const entries: ZipEntry[] = [];
  const missing: { path: string; reason: string }[] = [];

  const results = await Promise.all(
    AFFECTED_GROUPS.flatMap((group) =>
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

/**
 * Builds the archive's README.
 *
 * @param missing - Anything the source route would not return.
 * @param proposedCount - How many proposed files are in the archive.
 * @returns Markdown describing the archive's layout.
 *
 * @remarks
 * States the misses plainly, and says outright that `current/` is a sample.
 * An archive that quietly omits files reads as complete, and someone
 * estimating from it would be estimating from a subset without knowing.
 */
export const buildManifest = (
  missing: CollectedSources["missing"],
  proposedCount: number
): string => {
  const lines = [
    "# What is in this archive",
    "",
    "- `REQUIREMENTS.md` — the full requirements document.",
    "- `current/` — a sample of the app's source as it is today, grouped by",
    "  what it does. One file per idea rather than every file the work touches:",
    "  the rest follow the same patterns and are named under each requirement's",
    '  "In the code" on the spec page.',
    "- `proposed/` — the reference code from the spec page.",
    "",
    "Paths under `current/` mirror `issuer-portal/`, so a file at",
    "`current/glossary/components/ui/GlossaryText.tsx` lives at",
    "`issuer-portal/components/ui/GlossaryText.tsx`.",
    "",
    `${proposedCount} proposed files are included.`,
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
