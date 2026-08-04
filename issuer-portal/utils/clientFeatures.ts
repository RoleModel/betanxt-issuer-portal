import type { ClientFeatureKey } from "@/hooks/useClients";

/**
 * Identity map of feature keys, used in place of string literals (and instead
 * of an enum) when referencing features such as the NOBO gate.
 */
export const FEATURE_KEYS: Record<ClientFeatureKey, ClientFeatureKey> = {
  documents: "documents",
  mailing: "mailing",
  tabulation: "tabulation",
  reports: "reports",
  fileTransfer: "fileTransfer",
  agenda: "agenda",
  nobo: "nobo",
};

/** Human-readable label for each feature key, shown in admin feature toggles and tabs. */
export const FEATURE_LABELS: Record<ClientFeatureKey, string> = {
  documents: "Documents",
  mailing: "Mailing",
  tabulation: "Tabulation",
  reports: "Reports",
  fileTransfer: "File Transfer",
  agenda: "Agenda",
  nobo: "Engage (NOBO)",
};

export { type ClientFeatureKey } from "@/hooks/useClients";
