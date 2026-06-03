export interface QuorumGaugeViewModel {
  totalOutstandingShares: number;
  representedShares: number;
  quorumRequirementPercent: number;
  requiredShares: number;
  percentRepresented: number;
  percentToQuorum: number;
  cappedPercentToQuorum: number;
  quorumMet: boolean;
}

const toFiniteNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwo = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const buildQuorumGaugeModel = (params: {
  totalOutstandingShares: number | string | null | undefined;
  representedShares: number | string | null | undefined;
  quorumRequirementPercent?: number | string | null | undefined;
}): QuorumGaugeViewModel => {
  const totalOutstandingShares = toFiniteNumber(params.totalOutstandingShares);
  const representedShares = toFiniteNumber(params.representedShares);
  const quorumRequirementPercent = toFiniteNumber(params.quorumRequirementPercent) || 50;
  const requiredShares = totalOutstandingShares * (quorumRequirementPercent / 100);
  const percentRepresented =
    totalOutstandingShares > 0 ? (representedShares / totalOutstandingShares) * 100 : 0;
  const percentToQuorum = requiredShares > 0 ? (representedShares / requiredShares) * 100 : 0;

  return {
    totalOutstandingShares,
    representedShares,
    quorumRequirementPercent,
    requiredShares,
    percentRepresented: roundToTwo(percentRepresented),
    percentToQuorum: roundToTwo(percentToQuorum),
    cappedPercentToQuorum: Math.min(roundToTwo(percentToQuorum), 100),
    quorumMet: representedShares >= requiredShares && requiredShares > 0,
  };
};

/** Share count needed to satisfy quorum as a fraction of outstanding shares. */
export function quorumRequiredShares(
  totalOutstandingShares: number | string | null | undefined,
  quorumRequirementPercent?: number | string | null,
): number {
  const total = toFiniteNumber(totalOutstandingShares);
  const pct = toFiniteNumber(quorumRequirementPercent) || 50;
  return total * (pct / 100);
}

/**
 * Label for tabulation PDF "% Needed for Quorum" (percent only; export template appends "+ 1 Vote").
 */
export function formatQuorumRequirementPercentLabel(
  quorumRequirementPercent?: number | string | null,
): string {
  const pct = toFiniteNumber(quorumRequirementPercent) || 50;
  if (pct === 50) return "50%";
  if (pct === 33.3 || pct === 33.33) return "33.3%";
  if (pct === 66.6 || pct === 66.67) return "66.6%";
  if (pct === 80) return "80%";
  return `${pct}%`;
}
