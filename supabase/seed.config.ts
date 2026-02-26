// Seed configuration for the mock API server
// This file is used by seed.ts to generate SQL statements

export const seedConfig = {
  // Client configurations for seed data
  clients: [
    {
      ticker: 'WEN',
      companyName: "The Wendy's Company",
      shortName: "Wendy's",
      industry: 'Restaurants',
      description: 'Quick-service restaurant chain',
      website: 'https://www.wendys.com',
      primaryContact: 'Mike Chen',
      primaryContactEmail: 'mike.chen@wendys.com',
      isActive: true,
      brandingId: 966152,
    },
    {
      ticker: 'PAYC',
      companyName: 'Paycom Software, Inc.',
      shortName: 'Paycom',
      industry: 'Software',
      description: 'Cloud-based human capital management software',
      website: 'https://www.paycom.com',
      primaryContact: 'Lisa Rodriguez',
      primaryContactEmail: 'lisa.rodriguez@paycom.com',
      isActive: true,
      brandingId: 963998,
    },
    {
      ticker: 'WWD',
      companyName: 'Woodward, Inc.',
      shortName: 'Woodward',
      industry: 'Aerospace & Defense',
      description: 'Aerospace and industrial control systems',
      website: 'https://www.woodward.com',
      primaryContact: 'David Kim',
      primaryContactEmail: 'david.kim@woodward.com',
      isActive: true,
      brandingId: 962713,
    },
    {
      ticker: 'ELVN',
      companyName: 'Enliven Therapeutics, Inc.',
      shortName: 'Enliven',
      industry: 'Biotechnology',
      description: 'Clinical-stage biopharmaceutical company',
      website: 'https://www.enliven.com',
      primaryContact: 'Jenny Patel',
      primaryContactEmail: 'jenny.patel@enliven.com',
      isActive: true,
      brandingId: null,
    },
  ],

  // Account configurations (now separated from clients)
  accounts: [
    {
      clientTicker: 'WEN',
      accountName: "The Wendy's Company",
      primaryContact: 'Mike Chen',
      cusip: '95058W100',
      totalSharesOutstanding: 196234142,
      quorumRequirement: 50.0,
      brokerNonVote: 22480600.0,
    },
    {
      clientTicker: 'PAYC',
      accountName: 'Paycom Software, Inc.',
      primaryContact: 'Lisa Rodriguez',
      cusip: '70432V102',
      totalSharesOutstanding: 57852318,
      quorumRequirement: 33.33,
      brokerNonVote: 7412199.85,
    },
    {
      clientTicker: 'WWD',
      accountName: 'Woodward, Inc.',
      primaryContact: 'David Kim',
      cusip: '980745103',
      totalSharesOutstanding: 59402491,
      quorumRequirement: 50.0,
      brokerNonVote: 5855516.89,
    },
    {
      clientTicker: 'ELVN',
      accountName: 'Enliven Therapeutics, Inc.',
      primaryContact: 'Jenny Patel',
      cusip: '29337E102',
      totalSharesOutstanding: 49066008,
      quorumRequirement: 50.0,
      brokerNonVote: 3635711.0,
    },
  ],

  // User configurations
  users: {
    developer: {
      username: 'dev.user',
      firstName: 'Dev',
      lastName: 'User',
      email: 'dev@betanxt.com',
      type: 'ADMIN',
    },
    test: {
      username: 'test.user',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@betanxt.com',
      type: 'ADMIN',
    },
    relationshipManager: {
      username: 'sarah.johnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@betanxt.com',
      type: 'RELATIONSHIP_MANAGER',
    },
    issuerUsers: [
      {
        username: 'mike.chen',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike.chen@wendys.com',
        type: 'ADMIN',
        company: "The Wendy's Company",
      },
      {
        username: 'lisa.rodriguez',
        firstName: 'Lisa',
        lastName: 'Rodriguez',
        email: 'lisa.rodriguez@paycom.com',
        type: 'ISSUER',
        company: 'Paycom Software, Inc.',
      },
      {
        username: 'david.kim',
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@woodward.com',
        type: 'ADMIN',
        company: 'Woodward, Inc.',
      },
      {
        username: 'jenny.patel',
        firstName: 'Jenny',
        lastName: 'Patel',
        email: 'jenny.patel@enliven.com',
        type: 'ISSUER',
        company: 'Enliven Therapeutics, Inc.',
      },
    ],
  },

  // Seed data parameters
  seedParams: {
    positionCount: 15000,
    userActivityVariation: true,
    includeHistoricalPatterns: true,
    randomSeed: 12345,
    generateVotes: true,
  },

  // CSV data files - Three files per company minimum
  csvFiles: {
    // Wendy's data files
    wendysMeetingInfo: '../data/wendys_meeting_info.csv',
    wendysProposals: '../data/wendys_proposals.csv',
    wendysPositions: '../data/wendys_positions_2025.csv',
    wendysDTC: '../data/wendys_dtc_vote_status.csv',
    wendysNonDTC: '../data/wendys_non_dtc_vote_status.csv',
    // Enliven data files
    enlivenMeetingInfo: '../data/enliven_meeting_info.csv',
    enlivenProposals: '../data/enliven_proposals_2025.csv',
    enlivenPositions: '../data/enliven_positions_2025.csv',
    enlivenDTC: '../data/enliven_dtc_vote_status.csv',
    enlivenNonDTC: '../data/enliven_non_dtc_vote_status.csv',
    // Paycom data files
    paycomMeetingInfo: '../data/paycom_meeting_info.csv',
    paycomProposals: '../data/paycom_proposals_2025.csv',
    paycomPositions: '../data/paycom_positions_2025.csv',
    paycomDTC: '../data/paycom_dtc_vote_status.csv',
    paycomNonDTC: '../data/paycom_non_dtc_vote_status.csv',
    // Woodward data files
    woodwardMeetingInfo: '../data/woodward_meeting_info.csv',
    woodwardProposals: '../data/woodward_proposals_2025.csv',
    woodwardPositions: '../data/woodward_positions_2025.csv',
    woodwardDTC: '../data/woodward_dtc_vote_status.csv',
    woodwardNonDTC: '../data/woodward_non_dtc_vote_status.csv',
  },
}
