/**
 * Dependency-free syntax highlighting for the spec viewer.
 *
 * @remarks
 * The portal ships no highlighter (no Prism, Shiki, or highlight.js in
 * `package.json`), and pulling one in for a single internal documentation route
 * would add a runtime dependency plus a theme stylesheet to every bundle that
 * touches it. The spec page only ever renders TypeScript, TSX, JSON, and
 * Markdown, so a small hand-rolled tokenizer covers the whole surface and keeps
 * the page a pure MUI component styled from `theme.vars`.
 *
 * The tokenizer is deliberately single-pass: one alternation per language,
 * ordered so the greediest rules (comments, strings) win before identifier
 * rules can claim their contents. That ordering is the whole correctness story
 * — a keyword inside a string must stay a string.
 */

/** Languages the viewer knows how to colour. */
export type CodeLanguage = "json" | "markdown" | "text" | "tsx" | "typescript";

/** Semantic slot a token maps to, resolved to a colour by the viewer. */
export type TokenKind =
  | "attribute"
  | "comment"
  | "function"
  | "heading"
  | "keyword"
  | "number"
  | "operator"
  | "plain"
  | "property"
  | "punctuation"
  | "string"
  | "tag"
  | "type";

export interface CodeToken {
  readonly kind: TokenKind;
  readonly value: string;
}

const TS_KEYWORDS = new Set([
  "abstract",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "infer",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "new",
  "null",
  "of",
  "readonly",
  "return",
  "satisfies",
  "set",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

const TS_TYPES = new Set([
  "Array",
  "Boolean",
  "Map",
  "Number",
  "Partial",
  "Pick",
  "Promise",
  "Set",
  "Omit",
  "Readonly",
  "Record",
  "String",
  "boolean",
  "never",
  "number",
  "object",
  "string",
  "unknown",
]);

/**
 * One pattern per token class, ordered longest-context-first.
 *
 * @remarks
 * Named groups let a single `matchAll` pass classify every token without
 * re-scanning: the first group that participates in a match names the kind.
 * Comments and strings lead so their contents are consumed whole.
 */
const TS_PATTERN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    // Backticks are written as `\x60` so the alternation can live inside a raw
    // template literal — a literal `\`` is an invalid identity escape under the
    // `u` flag and throws at module load rather than at match time.
    String.raw`(?<string>"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|\x60(?:[^\x60\\]|\\.)*\x60)`,
    String.raw`(?<tag><\/?[A-Z][\w.]*|\/?>)`,
    String.raw`(?<function>[A-Za-z_$][\w$]*(?=\s*\())`,
    String.raw`(?<word>[A-Za-z_$][\w$]*)`,
    String.raw`(?<number>\b\d[\d_]*(?:\.\d+)?\b)`,
    String.raw`(?<punctuation>[{}[\]();,.:?])`,
    String.raw`(?<operator>=>|[=+\-*/%<>!&|^~]+)`,
  ].join("|"),
  "gu"
);

const MARKDOWN_PATTERN = new RegExp(
  [
    String.raw`(?<heading>^#{1,6}[^\n]*$)`,
    String.raw`(?<comment>^>[^\n]*$)`,
    String.raw`(?<string>\*\*[^*\n]+\*\*|\x60[^\x60\n]+\x60)`,
    String.raw`(?<keyword>^\s*[-*+]\s|^\s*\d+\.\s|^\|.*\|$)`,
    String.raw`(?<property>\[[^\]\n]+\]\([^)\n]+\))`,
  ].join("|"),
  "gmu"
);

const JSON_PATTERN = new RegExp(
  [
    String.raw`(?<property>"(?:[^"\\]|\\.)*"(?=\s*:))`,
    String.raw`(?<string>"(?:[^"\\]|\\.)*")`,
    String.raw`(?<number>-?\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)`,
    String.raw`(?<keyword>\b(?:true|false|null)\b)`,
    String.raw`(?<punctuation>[{}[\],:])`,
  ].join("|"),
  "giu"
);

/**
 * Which named group matched, and what it means.
 *
 * @param groups - The match's named groups.
 * @returns The group's name and captured text, or `null` when nothing matched.
 */
const firstGroup = (
  groups: Record<string, string | undefined> | undefined
): { name: string; value: string } | null => {
  if (groups === undefined) {
    return null;
  }

  for (const [name, value] of Object.entries(groups)) {
    if (value !== undefined) {
      return { name, value };
    }
  }

  return null;
};

/**
 * Resolves a bare identifier to a keyword, a known type, or plain text.
 *
 * @param word - The identifier as written.
 * @returns The token kind the viewer should colour it with.
 */
const classifyWord = (word: string): TokenKind => {
  if (TS_KEYWORDS.has(word)) {
    return "keyword";
  }

  if (TS_TYPES.has(word)) {
    return "type";
  }

  // PascalCase that is not a call is a component, a type, or a class — all of
  // which read the same way to someone scanning a spec.
  if (/^[A-Z]/u.test(word)) {
    return "type";
  }

  return "plain";
};

/**
 * Splits source into coloured tokens for one language.
 *
 * @param source - Raw code, exactly as it should appear on screen.
 * @param language - Which grammar to apply. `"text"` yields a single token.
 * @returns Tokens in source order; concatenating their values restores `source`.
 *
 * @remarks
 * Every byte between matches is emitted as a `plain` token rather than dropped,
 * so the rendered block is always a faithful copy of the input — the viewer's
 * copy and download buttons can therefore read from the same string the reader
 * sees, with no risk of the two drifting.
 */
export const tokenize = (
  source: string,
  language: CodeLanguage
): readonly CodeToken[] => {
  if (language === "text") {
    return [{ kind: "plain", value: source }];
  }

  const pattern =
    language === "markdown"
      ? MARKDOWN_PATTERN
      : language === "json"
        ? JSON_PATTERN
        : TS_PATTERN;

  const tokens: CodeToken[] = [];
  let lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    const group = firstGroup(match.groups);

    if (group === null) {
      continue;
    }

    if (match.index > lastIndex) {
      tokens.push({
        kind: "plain",
        value: source.slice(lastIndex, match.index),
      });
    }

    tokens.push({
      kind:
        group.name === "word"
          ? classifyWord(group.value)
          : (group.name as TokenKind),
      value: group.value,
    });

    lastIndex = match.index + group.value.length;
  }

  if (lastIndex < source.length) {
    tokens.push({ kind: "plain", value: source.slice(lastIndex) });
  }

  return tokens;
};
