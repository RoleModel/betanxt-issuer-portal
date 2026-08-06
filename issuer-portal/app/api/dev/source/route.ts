/* eslint-disable unicorn/no-top-level-assignment-in-function */
/* eslint-disable compat/compat */
/* eslint-disable func-style -- Next.js route handlers must be exported function declarations named GET/POST/etc. */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { sourceManifest } from "./source-manifest.generated";
import { isDevOverlayEnabled } from "@/utils/developmentOverlay";

/**
 * Serves a component's own source to the dev overlay.
 *
 * @remarks
 * The overlay names a component from the React tree; this resolves that name to
 * a file so the inspector can show the code that actually rendered what you are
 * pointing at, rather than a hand-maintained snippet that drifts.
 *
 * Under `next dev` the working tree is right there, so the handler reads it live
 * and edits show up without a rebuild. On a deployment (Vercel preview or
 * production) there is no working tree — and the remote developers this exists
 * for never clone the repo — so it serves `sourceManifest`, a build-time
 * snapshot bundled into this route. Either way the code is served from the code,
 * never from a file system the deployment does not have.
 *
 * The handler 404s unless {@link isDevOverlayEnabled} is true, so production
 * (where the flag is unset) never exposes source.
 */

const SEARCH_ROOTS = ["components", "app", "contexts", "hooks", "utils", "lib"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIP_DIRECTORIES = new Set(["node_modules", ".next", ".turbo", "dist"]);
const COMPONENT_NAME_PATTERN = /^[A-Za-z]\w{0,63}$/u;

// Under `next dev` read the live tree; anywhere else there is none, so serve the
// bundled snapshot instead.
const IS_SERVE_FROM_MANIFEST = process.env.NODE_ENV !== "development";

/** Normalise OS path separators to the forward slashes the manifest keys use. */
const toPosix = (value: string): string => value.split(path.sep).join("/");

/** Built once per server process; the tree does not move while it is running. */
let fileIndexPromise: Promise<readonly string[]> | null = null;

const walk = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return SKIP_DIRECTORIES.has(entry.name) ? [] : await walk(entryPath);
      }

      return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [entryPath] : [];
    })
  );

  return files.flat();
};

const buildFileIndex = async (): Promise<readonly string[]> => {
  const root = process.cwd();
  const roots = await Promise.all(
    SEARCH_ROOTS.map(async (directory): Promise<string[]> => {
      try {
        return await walk(path.join(root, directory));
      } catch {
        // A root that isn't present in this workspace is not an error.
        return [];
      }
    })
  );

  // Keep the working set repo-relative so the fs and manifest paths are the same
  // shape everywhere downstream.
  return roots.flat().map((filePath) => toPosix(path.relative(root, filePath)));
};

/** Repo-relative source paths: manifest keys on a deployment, the tree locally. */
const listSourcePaths = async (): Promise<readonly string[]> => {
  if (IS_SERVE_FROM_MANIFEST) {
    return Object.keys(sourceManifest);
  }

  fileIndexPromise ??= buildFileIndex();
  return await fileIndexPromise;
};

/**
 * Reads one repo-relative source file from the manifest or the working tree.
 *
 * @param requested - Repo-relative path as sent by the client or taken from the index.
 * @returns The file's text, or `null` when the path escapes the search roots or is unknown.
 *
 * @remarks
 * The path is checked rather than trusted: it must sit inside a search root,
 * carry a source extension, and contain no `.`/`..` segments. A handler that
 * reads an arbitrary path is a handler that reads `.env`.
 */
const readSource = async (requested: string): Promise<string | null> => {
  const normalized = toPosix(requested);
  const segments = new Set(normalized.split("/"));

  if (segments.has("..") || segments.has(".")) {
    return null;
  }

  const isUnderSearchRoot = SEARCH_ROOTS.some(
    (directory) =>
      normalized === directory || normalized.startsWith(`${directory}/`)
  );

  if (!isUnderSearchRoot || !SOURCE_EXTENSIONS.has(path.extname(normalized))) {
    return null;
  }

  if (IS_SERVE_FROM_MANIFEST) {
    return sourceManifest[normalized] ?? null;
  }

  try {
    return await readFile(path.resolve(process.cwd(), normalized), "utf-8");
  } catch {
    return null;
  }
};

/** Line the component is declared on, so the overlay can scroll to it. */
const findDeclarationLine = (source: string, name: string): number => {
  const declaration = new RegExp(
    String.raw`^\s*(?:export\s+)?(?:const|function|class)\s+${name}\b`,
    "mu"
  );
  const match = declaration.exec(source);

  return match === null ? 1 : source.slice(0, match.index).split("\n").length;
};

const scoreCandidate = (filePath: string, name: string): number => {
  const base = path.basename(filePath, path.extname(filePath));

  if (base === name) {
    return 0;
  }

  // Same name, different case ("useFoo.ts" vs "UseFoo") still beats a content hit.
  return base.toLowerCase() === name.toLowerCase() ? 1 : 2;
};

export async function GET(request: Request): Promise<NextResponse> {
  if (!isDevOverlayEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parameters = new URL(request.url);
  const searchParameters = parameters.searchParams;
  const requestedNames = searchParameters.get("components");

  // Which of these names the repo actually defines. The overlay asks so it can
  // tell an app component from a library one by the file system rather than by
  // guessing at a name — MUI X chart internals and the app's own chart
  // components are named too much alike for a heuristic to settle it.
  if (requestedNames !== null) {
    const names = requestedNames
      .split(",")
      .filter((name) => COMPONENT_NAME_PATTERN.test(name))
      .slice(0, 24);
    const index = await listSourcePaths();

    return NextResponse.json({
      known: names.filter((name) =>
        index.some((filePath) => scoreCandidate(filePath, name) === 0)
      ),
    });
  }

  const requestedPath = searchParameters.get("file");

  if (requestedPath !== null) {
    const source = await readSource(requestedPath);

    return source === null
      ? NextResponse.json(
          { error: `Cannot read ${requestedPath}` },
          { status: 404 }
        )
      : NextResponse.json({ line: 1, path: toPosix(requestedPath), source });
  }

  const name = searchParameters.get("component");

  if (name === null || !COMPONENT_NAME_PATTERN.test(name)) {
    return NextResponse.json(
      { error: "A component name is required" },
      { status: 400 }
    );
  }

  const index = await listSourcePaths();
  const byFilename = index
    .filter((filePath) => scoreCandidate(filePath, name) < 2)
    // The array is already a fresh copy from `filter`, so sorting in place is safe.
    .sort(
      (first: string, second: string) =>
        scoreCandidate(first, name) - scoreCandidate(second, name)
    );

  const declaration = new RegExp(
    String.raw`(?:export\s+)?(?:const|function|class)\s+${name}\b`,
    "u"
  );

  // Filename first, then whoever declares the identifier. Reading candidates in
  // sequence is deliberate: the first match usually lands on the first file.
  const candidates =
    byFilename.length > 0
      ? byFilename
      : index.filter((filePath) => filePath.includes(name));

  for (const filePath of candidates.slice(0, 40)) {
    // eslint-disable-next-line no-await-in-loop -- ordered preference chain
    const source = await readSource(filePath);

    if (source === null) {
      continue;
    }

    if (byFilename.length > 0 || declaration.test(source)) {
      return NextResponse.json({
        line: findDeclarationLine(source, name),
        path: filePath,
        source,
      });
    }
  }

  return NextResponse.json(
    { error: `No source file found for ${name}` },
    { status: 404 }
  );
}
