export interface QuorumGaugeViewModel {
  totalOutstandingShares: number
  representedShares: number
  quorumRequirementPercent: number
  requiredShares: number
  percentRepresented: number
  percentToQuorum: number
  cappedPercentToQuorum: number
  quorumMet: boolean
}

const toFiniteNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const roundToTwo = (value: number): number => {
  return Math.round(value * 100) / 100
}

export const buildQuorumGaugeModel = (params: {
  totalOutstandingShares: number | string | null | undefined
  representedShares: number | string | null | undefined
  quorumRequirementPercent?: number | string | null | undefined
}): QuorumGaugeViewModel => {
  const totalOutstandingShares = toFiniteNumber(params.totalOutstandingShares)
  const representedShares = toFiniteNumber(params.representedShares)
  const quorumRequirementPercent = toFiniteNumber(params.quorumRequirementPercent) || 50
  const requiredShares = totalOutstandingShares * (quorumRequirementPercent / 100)
  const percentRepresented =
    totalOutstandingShares > 0 ? (representedShares / totalOutstandingShares) * 100 : 0
  const percentToQuorum =
    requiredShares > 0 ? (representedShares / requiredShares) * 100 : 0

  return {
    totalOutstandingShares,
    representedShares,
    quorumRequirementPercent,
    requiredShares,
    percentRepresented: roundToTwo(percentRepresented),
    percentToQuorum: roundToTwo(percentToQuorum),
    cappedPercentToQuorum: Math.min(roundToTwo(percentToQuorum), 100),
    quorumMet: representedShares >= requiredShares && requiredShares > 0,
  }
}
