/**
 * Utility functions for determining voting options based on proposal type
 */

export interface VotingOptions {
  for: string;
  against: string;
  abstain: string;
}

const MAJORITY_VOTING_TICKERS = new Set(["WEN", "PAYC", "ELVN", "WWD"]);

export const usesMajorityVotingOptions = (ticker?: string): boolean => {
  if (!ticker) return false;

  return MAJORITY_VOTING_TICKERS.has(ticker.toUpperCase());
};

/**
 * Determines if a proposal is a director election based on type and number
 */
export const isDirectorElection = (
  proposalType?: string,
  _proposalNumber?: string | number,
  directorName?: string,
): boolean => {
  if (directorName) return true;
  if (!proposalType) return false;

  const lowerType = proposalType.toLowerCase();

  return lowerType.includes("election") || lowerType.includes("director");
};

/**
 * Gets the appropriate voting options for a proposal
 * Based on real client report documentation: director elections use WITHHOLD instead of AGAINST
 */
export const getVotingOptions = (
  proposalType?: string,
  proposalNumber?: string | number,
  ticker?: string,
  directorName?: string,
): VotingOptions => {
  const isDirectorProposal = isDirectorElection(proposalType, proposalNumber, directorName);

  if (isDirectorProposal && !usesMajorityVotingOptions(ticker)) {
    return {
      for: "For",
      against: "Withhold", // Director elections: "Against" field contains WITHHOLD votes
      abstain: "Withhold/Abstain",
    };
  }

  return {
    for: "For",
    against: "Against",
    abstain: "Withhold/Abstain",
  };
};

/**
 * Gets the visible voting options for agenda display
 */
export const getVotingOptionsDisplay = (
  proposalType?: string,
  proposalNumber?: string | number,
  ticker?: string,
  directorName?: string,
): string[] => {
  const isDirectorProposal = isDirectorElection(proposalType, proposalNumber, directorName);

  if (isDirectorProposal && !usesMajorityVotingOptions(ticker)) {
    return ["FOR", "WITHHOLD/ABSTAIN"];
  }

  return ["FOR", "AGAINST", "WITHHOLD/ABSTAIN"];
};

/**
 * Gets table headers for tabulation tables that may contain mixed proposal types
 * Based on real client report documentation
 */
export const getTabulationHeaders = (
  proposals: {
    proposalType?: string;
    proposalNumber?: string | number;
    directorName?: string;
  }[],
  ticker?: string,
): VotingOptions => {
  if (usesMajorityVotingOptions(ticker)) {
    return {
      for: "For",
      against: "Against",
      abstain: "Withhold/Abstain",
    };
  }

  const hasDirectorElections = proposals.some((p) =>
    isDirectorElection(p.proposalType, p.proposalNumber, p.directorName),
  );
  const hasNonDirectorProposals = proposals.some(
    (p) => !isDirectorElection(p.proposalType, p.proposalNumber, p.directorName),
  );

  // Mixed tables still use the standard three-column header set.
  if (hasDirectorElections && hasNonDirectorProposals) {
    return {
      for: "For",
      against: "Against",
      abstain: "Withhold/Abstain",
    };
  }

  // If all are director elections, use director-specific labels
  if (hasDirectorElections) {
    return {
      for: "For",
      against: "Withhold",
      abstain: "Withhold/Abstain",
    };
  }

  // If all are non-director proposals, use standard labels
  return {
    for: "For",
    against: "Against",
    abstain: "Withhold/Abstain",
  };
};
