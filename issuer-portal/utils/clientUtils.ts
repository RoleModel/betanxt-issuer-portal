/**
 * Utility functions for client management
 * Includes logo mapping, client information, and related utilities
 */

// Logo mapping based on client names and tickers
const LOGO_MAPPING: Record<string, string> = {
  // Company name mappings
  "The Wendy's Company": "/logos/wendys_logo.svg.svg",
  "Paycom Software, Inc.": "/logos/paycom_logo.svg.svg",
  "Woodward, Inc.": "/logos/woodward_logo.svg.svg",
  "Enliven Therapeutics, Inc.": "/logos/enliven-logo.svg",

  // Ticker mappings (fallback)
  WEN: "/logos/wendys_logo.svg.svg",
  PAYC: "/logos/paycom_logo.svg.svg",
  WWD: "/logos/woodward_logo.svg.svg",
  ELVN: "/logos/enliven-logo.svg",

  // Account code mappings (fallback)
  "WEN-2024": "/logos/wendys_logo.svg.svg",
  "PAYC-2024": "/logos/paycom_logo.svg.svg",
  "WWD-2024": "/logos/woodward_logo.svg.svg",
  "ELVN-2024": "/logos/enliven-logo.svg",
};

// Default logo for unknown clients
const DEFAULT_LOGO = "/images/logo.svg"; // BetaNXT default logo

/**
 * Get the logo path for a client based on their name, ticker, or account code
 * @param clientName - The client's name
 * @param ticker - Optional ticker symbol
 * @param accountCode - Optional account code
 * @returns The path to the client's logo
 */
export const getClientLogo = (
  clientName?: string,
  ticker?: string,
  accountCode?: string,
): string => {
  // Try exact client name match first
  if (clientName && LOGO_MAPPING[clientName]) {
    return LOGO_MAPPING[clientName];
  }

  // Try ticker match
  if (ticker && LOGO_MAPPING[ticker]) {
    return LOGO_MAPPING[ticker];
  }

  // Try account code match
  if (accountCode && LOGO_MAPPING[accountCode]) {
    return LOGO_MAPPING[accountCode];
  }

  // Try partial name matching for flexibility
  if (clientName) {
    const lowerClientName = clientName.toLowerCase();

    if (lowerClientName.includes("wendy")) {
      return LOGO_MAPPING["The Wendy's Company"];
    }
    if (lowerClientName.includes("paycom")) {
      return LOGO_MAPPING["Paycom Software, Inc."];
    }
    if (lowerClientName.includes("woodward")) {
      return LOGO_MAPPING["Woodward, Inc."];
    }
    if (lowerClientName.includes("enliven")) {
      return LOGO_MAPPING["Enliven Therapeutics, Inc."];
    }
  }

  // Return default logo if no match found
  return DEFAULT_LOGO;
};

/**
 * Get all available client logos
 * @returns Array of logo paths
 */
export const getAllClientLogos = (): string[] => {
  return Object.values(LOGO_MAPPING);
};

/**
 * Check if a logo exists for a given client
 * @param clientName - The client's name
 * @param ticker - Optional ticker symbol
 * @param accountCode - Optional account code
 * @returns True if a specific logo exists, false if default would be used
 */
export const hasClientLogo = (
  clientName?: string,
  ticker?: string,
  accountCode?: string,
): boolean => {
  return getClientLogo(clientName, ticker, accountCode) !== DEFAULT_LOGO;
};
