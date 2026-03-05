export interface PhaseConfig {
  id: string
  name: string
  dashboardComponents: DashboardComponent[]
  dataRequirements: string[]
  permissions: string[]
  refreshInterval?: number
}

export interface DashboardComponent {
  type:
    | 'voting-summary'
    | 'tabulation-table'
    | 'shares-chart'
    | 'key-dates'
    | 'meeting-info'
    | 'meeting-presence'
    | 'tabulation-report'
    | 'task-card'
    | 'document-hosting'
    | 'event-contacts'
    | 'phase7-layout'
  config: Record<string, unknown>
  priority: number
  gridProps?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export interface ProposalVoting {
  proposalNumber: number
  proposalId: string
  description: string
  proposalTitle?: string
  proposalType?: string
  directorName?: string
  recommendation?: string
  votingResults: {
    for: { shares: number; percentage: number }
    against: { shares: number; percentage: number }
    abstain: { shares: number; percentage: number }
  }
  totalShares: number
  status: 'active' | 'completed' | 'pending'
}

export interface VotingSummary {
  totalSharesVoted: number
  totalSharesOutstanding: number
  percentageVoted: number
  positionsVoted: number
  totalPositions: number
  lastUpdated: string
  votingMethods: {
    web: number
    paper: number
    phone: number
  }
  votingBreakdown: {
    for: { shares: number; percentage: number }
    against: { shares: number; percentage: number }
    abstain: { shares: number; percentage: number }
    withhold: { shares: number; percentage: number }
  }
}

export interface MeetingPresenceLink {
  title: string
  url: string
  description: string
  isActive: boolean
}

export interface TabulationReport {
  title: string
  description: string
  downloadUrl?: string
  isAvailable: boolean
}
