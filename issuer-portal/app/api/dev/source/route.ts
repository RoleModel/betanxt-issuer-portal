import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

/**
 * Serves a component's own source to the dev overlay.
 *
 * @remarks
 * The overlay names a component from the React tree; this resolves that name to
 * a file so the inspector can show the code that actually rendered what you are
 * pointing at, rather than a hand-maintained snippet that drifts. Development
 * only — the handler 404s in production, which is also where the file system it
 * reads from does not exist.
 */

const SEARCH_ROOTS = ["components", "app", "contexts", "hooks", "utils", "lib"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIP_DIRECTORIES = new Set(["node_modules", ".next", ".turbo", "dist"]);
const COMPONENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/u;

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

  return roots.flat();
};

const getFileIndex = async (): Promise<readonly string[]> => {
  fileIndexPromise ??= buildFileIndex();
  return await fileIndexPromise;
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
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const name = new URL(request.url).searchParams.get("component");

  if (name === null || !COMPONENT_NAME_PATTERN.test(name)) {
    return NextResponse.json(
      { error: "A component name is required" },
      { status: 400 }
    );
  }

  const index = await getFileIndex();
  const byFilename = index
    .filter((filePath) => scoreCandidate(filePath, name) < 2)
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
    const source = await readFile(filePath, "utf8");

    if (byFilename.length > 0 || declaration.test(source)) {
      return NextResponse.json({
        line: findDeclarationLine(source, name),
        path: path.relative(process.cwd(), filePath),
        source,
      });
    }
  }

  return NextResponse.json(
    { error: `No source file found for ${name}` },
    { status: 404 }
  );
}
