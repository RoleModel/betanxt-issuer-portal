/**
 * Utility functions for safe type casting and data transformation
 * Used across the app for handling unknown API response data
 */

/**
 * Safely cast unknown value to array
 * @param value - Unknown value to cast
 * @returns Array or empty array if cast fails
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return [];
}

/**
 * Safely cast unknown value to record/object
 * @param value - Unknown value to cast
 * @returns Record object or null if cast fails
 */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Safely cast unknown value to string
 * @param value - Unknown value to cast
 * @returns String or null if cast fails
 */
export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Safely cast unknown value to number
 * @param value - Unknown value to cast
 * @returns Number or null if cast fails
 */
export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Safely cast an unknown value to a boolean flag, defaulting to false.
 *
 * @param value - Unknown value to cast
 * @returns The boolean, or false when the value is absent or unrecognised
 *
 * @remarks
 * Returns a boolean rather than `boolean | null` because the flags read
 * through this — chiefly `tabulationReleased` — gate whether data is shown at
 * all, and an unreadable value has to resolve to the withholding side. Postgres
 * booleans reach the client as `true`/`false` through the API's domain
 * transforms but as `"t"`/`"true"` when a raw row is read directly, so both
 * spellings are accepted.
 */
export function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return value === "true" || value === "t";
}

/**
 * Get string value from object using multiple possible keys
 * @param obj - Object to search
 * @param keys - Array of possible keys to check
 * @returns String value or null if not found
 */
export function getStr(
  obj: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const k of keys) {
    const v = asString(obj[k]);
    if (v !== null) {
      return v;
    }
  }
  return null;
}

/**
 * Get number value from object using multiple possible keys
 * @param obj - Object to search
 * @param keys - Array of possible keys to check
 * @returns Number value or null if not found
 */
export function getNum(
  obj: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const k of keys) {
    const v = asNumber(obj[k]);
    if (v !== null) {
      return v;
    }
  }
  return null;
}
