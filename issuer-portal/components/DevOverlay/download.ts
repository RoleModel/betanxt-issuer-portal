"use client";

/** Saves text to the user's downloads folder under `filename`. */
export const downloadText = (
  filename: string,
  text: string,
  mimeType = "text/plain"
): void => {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

export interface FetchedFile {
  readonly path: string;
  readonly source: string;
}

const isFetchedFile = (value: unknown): value is FetchedFile =>
  typeof value === "object" &&
  value !== null &&
  typeof Reflect.get(value, "path") === "string" &&
  typeof Reflect.get(value, "source") === "string";

/**
 * Reads one repo file through the dev-only source route.
 *
 * @param repoPath - Path relative to the workspace root.
 * @returns The file, or `null` when the route declines to serve it.
 */
export const fetchRepoFile = async (
  repoPath: string
): Promise<FetchedFile | null> => {
  try {
    const response = await fetch(
      `/api/dev/source?file=${encodeURIComponent(repoPath)}`
    );

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    return isFetchedFile(data) ? data : null;
  } catch {
    return null;
  }
};

/**
 * Bundles several source files into one annotated Markdown document.
 *
 * @param title - Heading for the bundle.
 * @param preamble - Prose placed before the files, explaining what they are.
 * @param files - Files in the order they should be read.
 * @returns Markdown with each file in a fenced block under its path.
 *
 * @remarks
 * One Markdown file rather than an archive: it needs no tooling to open, it
 * survives being pasted into a ticket or a chat, and it keeps the explanation
 * next to the code it explains. Producing a real zip would mean shipping a zip
 * library into a development-only panel.
 */
export const toSourceBundle = (
  title: string,
  preamble: readonly string[],
  files: readonly FetchedFile[]
): string => {
  const extensionOf = (filePath: string): string =>
    filePath.endsWith(".tsx") ? "tsx" : "ts";

  return [
    `# ${title}`,
    "",
    `Generated ${new Date().toISOString()} from the running development app.`,
    "",
    ...preamble.flatMap((line) => [line, ""]),
    "## Contents",
    "",
    ...files.map((file, index) => `${index + 1}. \`${file.path}\``),
    "",
    ...files.flatMap((file) => [
      `## \`${file.path}\``,
      "",
      `\`\`\`${extensionOf(file.path)}`,
      file.source.trimEnd(),
      "```",
      "",
    ]),
  ].join("\n");
};
