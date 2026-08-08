/**
 * Utility functions for safe type casting and data transformation
 * Used across the app for handling unknown API response data
 */

/**
 * Safely cast unknown value to array
 * @param value - Unknown value to cast
 * @returns Array or empty array if cast fails
 */
export const asArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- this is the one sanctioned boundary cast callers rely on instead of asserting `T` themselves.
    return value as T[];
  }
  return [];
};

/**
 * Safely cast unknown value to record/object
 * @param value - Unknown value to cast
 * @returns Record object or null if cast fails
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

/**
 * Safely cast unknown value to string
 * @param value - Unknown value to cast
 * @returns String or null if cast fails
 */
export const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

/**
 * Safely cast unknown value to number
 * @param value - Unknown value to cast
 * @returns Number or null if cast fails
 */
export const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Get string value from object using multiple possible keys
 * @param object - Object to search
 * @param keys - Array of possible keys to check
 * @returns String value or null if not found
 */
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

/**
 * Get number value from object using multiple possible keys
 * @param object - Object to search
 * @param keys - Array of possible keys to check
 * @returns Number value or null if not found
 */
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
 * Next.js route params (`useParams()`) type each segment as
 * `string | string[] | undefined` to account for catch-all routes. Every
 * route in this app uses single, non-catch-all segments, so this collapses
 * that union to the single string the caller actually wants.
 * @param value - A `useParams()` segment value
 * @returns The segment as a string, or "" when absent
 */
export const asParamString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
