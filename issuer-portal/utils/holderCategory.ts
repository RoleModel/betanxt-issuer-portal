/**
 * Holder category classification and predicates shared by the tabulation and
 * reporting features. Categories distinguish directly registered holders,
 * plan (employee stock plan) holders, street-name beneficial holders, and
 * NOBO (Non-Objecting Beneficial Owner) holders, with a legacy
 * accountType-based fallback for positions that predate the field.
 */
const HOLDER_CATEGORIES = ["REGISTERED", "PLAN", "BENEFICIAL", "NOBO"] as const;

/** Position holder classification: REGISTERED, PLAN, BENEFICIAL, or NOBO. */
export type HolderCategory = (typeof HOLDER_CATEGORIES)[number];

const LEGACY_REGISTERED_ACCOUNT_TYPE = "DTC/CDS";

/**
 * Normalize an unknown API value (snake_case or camelCase source) into a
 * HolderCategory, or null when absent/unrecognized.
 */
export function normalizeHolderCategory(value: unknown): HolderCategory | null {
  if (typeof value !== "string") return null;

  const upper = value.trim().toUpperCase();
  const match = HOLDER_CATEGORIES.find((category) => category === upper);
  return match ?? null;
}

/**
 * Registered-only predicate for the Voting Activity chart (FR-001/FR-002).
 * When holderCategory is present, only REGISTERED qualifies (PLAN is excluded);
 * otherwise fall back to the legacy accountType inference.
 */
export function isRegisteredOnlyHolder(
  holderCategory: HolderCategory | null,
  accountType: string,
): boolean {
  if (holderCategory) return holderCategory === "REGISTERED";
  return accountType === LEGACY_REGISTERED_ACCOUNT_TYPE;
}

/**
 * Broad registered-vs-beneficial classification used by holder-type filters:
 * REGISTERED/PLAN -> "registered", BENEFICIAL/NOBO -> "beneficial",
 * with the legacy accountType fallback when holderCategory is missing.
 */
export function getHolderTypeFromCategory(
  holderCategory: HolderCategory | null,
  accountType: string,
): "registered" | "beneficial" {
  if (holderCategory) {
    return holderCategory === "REGISTERED" || holderCategory === "PLAN"
      ? "registered"
      : "beneficial";
  }
  return accountType === LEGACY_REGISTERED_ACCOUNT_TYPE ? "registered" : "beneficial";
}
