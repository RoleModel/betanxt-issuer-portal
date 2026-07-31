/**
 * Ambient declarations for runtime APIs this workspace uses that the resolved
 * TypeScript version does not yet declare.
 *
 * `RegExp.escape` is ES2025 and is available in our Node 24 runtime, but its
 * declaration only ships in TypeScript 6 (`lib.es2025.regexp.d.ts`). This
 * workspace currently resolves TypeScript 5.9, so declare it here.
 * Remove this once the workspace resolves TypeScript 6 and `ES2025.RegExp`
 * can be added to `lib` in tsconfig.json instead.
 */
interface RegExpConstructor {
  escape: (string: string) => string;
}
