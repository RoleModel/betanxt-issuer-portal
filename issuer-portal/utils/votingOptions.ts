/**
 * Utility functions for determining voting options based on proposal type
 */

export interface VotingOptions {
  for: string
  against: string
  abstain: string
}

/**
 * Determines if a proposal is a director election based on type and number
 */
export const isDirectorElection = (
  proposalType?: string,
  proposalNumber?: string | number
): boolean => {
  if (!proposalType) return false

  const lowerType = proposalType.toLowerCase()

  // Check if it's a director election (typically proposals 1-3 or contains "Election" in type)
  return (
    lowerType.includes('election') ||
    lowerType.includes('director') ||
    (proposalNumber !== undefined &&
      proposalNumber !== null &&
      ['1', '2', '3'].includes(proposalNumber.toString()))
  )
}

/**
 * Gets the appropriate voting options for a proposal
 * Based on real client report documentation: director elections use WITHHOLD instead of AGAINST
 */
export const getVotingOptions = (
  proposalType?: string,
  proposalNumber?: string | number
): VotingOptions => {
  if (isDirectorElection(proposalType, proposalNumber)) {
    return {
      for: 'For',
      against: 'Withhold', // Director elections: "Against" field contains WITHHOLD votes
      abstain: 'Abstain',
    }
  }

  return {
    for: 'For',
    against: 'Against',
    abstain: 'Abstain',
  }
}

/**
 * Gets the voting options display string for agenda display
 * Based on real client report documentation
 */
export const getVotingOptionsDisplay = (
  proposalType?: string,
  proposalNumber?: string | number
): string => {
  if (isDirectorElection(proposalType, proposalNumber)) {
    return 'FOR / WITHHOLD / ABSTAIN'
  }
  return 'FOR / AGAINST / ABSTAIN'
}

/**
 * Gets table headers for tabulation tables that may contain mixed proposal types
 * Based on real client report documentation
 */
export const getTabulationHeaders = (
  proposals: { proposalType?: string; proposalNumber?: string | number }[]
): VotingOptions => {
  const hasDirectorElections = proposals.some((p) =>
    isDirectorElection(p.proposalType, p.proposalNumber)
  )
  const hasNonDirectorProposals = proposals.some(
    (p) => !isDirectorElection(p.proposalType, p.proposalNumber)
  )

  // If we have mixed types, use generic labels that work for both
  if (hasDirectorElections && hasNonDirectorProposals) {
    return {
      for: 'For',
      against: 'Against/Withhold',
      abstain: 'Abstain',
    }
  }

  // If all are director elections, use director-specific labels
  if (hasDirectorElections) {
    return {
      for: 'For',
      against: 'Withhold',
      abstain: 'Abstain',
    }
  }

  // If all are non-director proposals, use standard labels
  return {
    for: 'For',
    against: 'Against',
    abstain: 'Abstain',
  }
}
