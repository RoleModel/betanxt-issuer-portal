/**
 * Utility functions for safe type narrowing of `unknown` values — used
 * across domain-models/api/* when adapting raw Supabase/JSON data.
 */

export const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- `typeof value === "object"` narrows the value, not its property types; this is the sanctioned boundary cast.
    return value as Record<string, unknown>;
  }
  return null;
};

export const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- this is the one sanctioned boundary cast callers rely on instead of asserting `T` themselves.
    return value as T[];
  }
  return [];
};

export const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Reads the first key present on `obj` whose value is a string. */
export const getString = (
  object: Record<string, unknown>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const value = asString(object[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
};

/** Reads the first key present on `obj` whose value is a finite number. */
export const getNumber = (
  object: Record<string, unknown>,
  keys: string[]
): number | null => {
  for (const key of keys) {
    const value = asNumber(object[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
};

/**
 * Narrows a nullable DB string column (e.g. a `status` column with no
 * Postgres enum backing it) to one of `values`, or `undefined` if it isn't a
 * recognized member — instead of trusting the column with an unsafe cast.
 */
export const asLiteral = <T extends string>(
  value: string | null | undefined,
  values: readonly T[]
): T | undefined => {
  if (
    value === null ||
    value === undefined ||
    !(values as readonly string[]).includes(value)
  ) {
    return undefined;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- `values.includes(value)` just proved membership in `T`'s literal set; this is the sanctioned boundary cast.
  return value as T;
};
