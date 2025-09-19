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
    },
  ],

  // Account configurations (now separated from clients)
  accounts: [
    {
      clientTicker: 'WEN',
      accountName: "The Wendy's Company",
      primaryContact: 'Mike Chen',
      cusip: '95058W100',
      totalSharesOutstanding: 176618508,
      quorumRequirement: 50.0,
    },
    {
      clientTicker: 'PAYC',
      accountName: 'Paycom Software, Inc.',
      primaryContact: 'Lisa Rodriguez',
      cusip: '70432V102',
      totalSharesOutstanding: 58500000,
      quorumRequirement: 33.33,
    },
    {
      clientTicker: 'WWD',
      accountName: 'Woodward, Inc.',
      primaryContact: 'David Kim',
      cusip: '98056C108',
      totalSharesOutstanding: 63200000,
      quorumRequirement: 50.0,
    },
    {
      clientTicker: 'ELVN',
      accountName: 'Enliven Therapeutics, Inc.',
      primaryContact: 'Jenny Patel',
      cusip: '29265M108',
      totalSharesOutstanding: 42800000,
      quorumRequirement: 50.0,
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

  // CSV data files
  csvFiles: {
    wendysVotes: '../data/wendys_shareholder_votes_combined.csv',
    wendysTabulation: '../data/wendys_tabulation_data.csv',
    wendysNonDTC: '../data/wendys-Non-DTC_CDS_Vote_Status_Summary.csv',
  },
}
