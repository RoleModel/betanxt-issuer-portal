# Data Model: Seed Data for Issuer Portal Demo

## Overview

This document defines the data model for comprehensive seed data generation that demonstrates the complete shareholder meeting lifecycle across 4 companies in different phases.

## Core Entities

### Account

**Purpose**: Corporate issuer accounts and relationship manager account

**Fields**:

- `id`: UUID - Primary key
- `account`: string - Unique account identifier (e.g., "WEN-2024", "PAYC-2024")
- `name`: string - Company name (e.g., "The Wendy's Company")
- `primaryContact`: string - Contact person name
- `createdAt`: DateTime - Account creation timestamp

**Seed Data Pattern**:

- 5 accounts total: 1 relationship manager + 4 issuer companies
- Company accounts named after real companies with realistic identifiers
- Primary contacts use realistic executive names

### User

**Purpose**: System users with different roles and activity levels

**Fields**:

- `id`: UUID - Primary key
- `username`: string - Unique login identifier
- `firstName`: string - User's first name
- `lastName`: string - User's last name
- `email`: string - Email address
- `password`: string - Hashed password
- `type`: UserType enum - Role classification
- `accountId`: UUID - Foreign key to Account

**Seed Data Pattern**:

- 1 relationship manager (SYSTEM_ADMIN type) managing all 4 companies
- 6-8 issuer users across 4 companies (1-2 per company)
- Mix of ACCOUNT_ADMIN and ISSUER_USER types
- Realistic names and email addresses
- Varied activity levels and engagement patterns

### Meeting

**Purpose**: Shareholder meetings at different lifecycle phases

**Fields**:

- `id`: string - Meeting identifier (e.g., "WEN-2024-AGM")
- `title`: string - Meeting name
- `cusip`: string - Security identifier
- `ticker`: string - Stock ticker symbol
- `recordDate`: Date - Shareholder eligibility cutoff
- `mailingDate`: Date - Proxy material distribution
- `meetingDate`: Date - Actual meeting date
- `meetingType`: string - Type of meeting
- `meetingYear`: integer - Year of meeting
- `status`: MeetingStatus enum - Current phase
- `currentPhase`: string - Active phase name
- `overallCompletion`: integer - Progress percentage
- `distributionType`: string - How materials are distributed
- `transferAgent`: string - Transfer agent name
- `totalSharesOutstanding`: bigint - Total shares
- `quorumRequirement`: decimal - Quorum percentage
- `accountId`: UUID - Foreign key to Account

**Seed Data Pattern**:

- 4 meetings across different phases:
  - Wendy's: ACTIVE phase (voting in progress)
  - Paycom: PLANNING phase (early preparation)
  - Woodward: COMPLETED phase (results available)
  - Enliven: ADJOURNED phase (quorum not met)
- Realistic timelines working backwards from meeting dates
- Industry-appropriate share counts and quorum requirements

### Phase

**Purpose**: Meeting phases with realistic progression and status tracking

**Fields**:

- `id`: UUID - Primary key
- `meetingId`: string - Foreign key to Meeting
- `name`: string - Phase name (e.g., "Project Launch & Data Check")
- `orderIndex`: integer - Phase sequence (1-8)
- `status`: PhaseStatus enum - Current status
- `createdAt`: DateTime - Phase creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Seed Data Pattern**:

- Standard 8-phase workflow:
  1. Phase 1: Project Launch & Data Check
  2. Phase 2: Broker Search, Authorizations, and Proxy Card Notice
  3. Phase 3: Approaching Record Date, Proxy Card Readiness
  4. Phase 4: Shareholder Record File delivery expectations
  5. Phase 5: Pre-Mail Date
  6. Phase 6: Post Mail Date – Pre-Vote & Tabulation Reporting
  7. Phase 7: Tabulation Report & Meeting Details
  8. Phase 8: Registered Vote Report
- Realistic date progressions based on SEC Notice and Access timelines
- Some phases completed, some in progress, some pending
- Completion dates showing realistic project management scenarios

### PhaseKeyDate

**Purpose**: Important milestone dates within meeting phases

**Fields**:

- `id`: UUID - Primary key
- `phaseId`: UUID - Foreign key to Phase
- `meetingId`: string - Foreign key to Meeting
- `dateName`: string - Name of the key date (e.g., "Record Date", "Mail Date", "Meeting Date")
- `dateValue`: Date - The actual milestone date
- `isMandatory`: boolean - Whether this date is required for phase completion
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Seed Data Pattern**:

- Industry-standard key dates for each phase:
  - Phase 3: Record Date, Proxy Card Readiness Date
  - Phase 4: Shareholder Record File Delivery Date
  - Phase 5: Pre-Mail Date, Final Proxy Review Date
  - Phase 6: Mail Date, Vote Collection Start Date
  - Phase 7: Vote Cutoff Date, Tabulation Date, Meeting Date
  - Phase 8: Final Report Date, Registered Vote Report Date
- Realistic date sequences following SEC Notice and Access timelines
- Some dates as mandatory milestones, others as target dates

### Task

**Purpose**: Phase-specific tasks with realistic completion patterns

**Fields**:

- `id`: UUID - Primary key
- `taskId`: string - Unique task identifier
- `phaseId`: UUID - Foreign key to Phase
- `meetingId`: string - Foreign key to Meeting
- `title`: string - Task description
- `description`: text - Detailed task information
- `type`: string - Task category
- `status`: TaskStatus enum - Current status
- `dueDate`: Date - Task deadline
- `owner`: string - Assigned person

**Seed Data Pattern**:

- 15-20 tasks per meeting across all phases based on actual proxy voting workflow
- Mix of INCOMPLETE, COMPLETE, PENDING, NEEDS_AUTHORIZATION statuses
- Specific task types per phase:
  - Phase 1: DTCC authorizations, file requests, system access setup
  - Phase 2: Broker search, authorizations, proxy card notices
  - Phase 3: File deliveries, SPR processing, shareholder counts
  - Phase 4: Document approvals, filing deadlines, material delivery
  - Phase 5: Notice & Access deadlines, DSM introductions
  - Phase 6: Mailing activities, tabulation reporting, logistics
  - Phase 7: Official tabulation, DSM activities, final results
  - Phase 8: Form 8-K filings, registered vote reports
- Task ownership split between issuer tasks and BetaNXT (service provider) tasks
- Realistic completion patterns showing collaboration between parties

### Document

**Purpose**: Meeting documents with version history and approval workflows

**Fields**:

- `id`: UUID - Primary key
- `meetingId`: string - Foreign key to Meeting
- `title`: string - Document name
- `description`: text - Document description
- `type`: string - Document category
- `filePath`: string - File storage location
- `fileType`: string - MIME type
- `fileSize`: integer - File size in bytes
- `status`: DocumentStatus enum - Current state
- `uploadDate`: DateTime - Upload timestamp
- `signedDate`: DateTime - Signature completion
- `authorizedDate`: DateTime - Authorization completion

**Seed Data Pattern**:

- Core documents: Proxy Statement, Notice of Meeting, Voting Instructions
- Multiple versions showing revision history
- Different approval states across companies
- Realistic file sizes and types (PDF, DOCX)

### Position

**Purpose**: Shareholder positions based on Wendy's historical patterns

**Fields**:

- `id`: UUID - Primary key
- `meetingId`: string - Foreign key to Meeting
- `cusip`: string - Security identifier
- `accountType`: string - Type of holding account
- `name`: string - Position holder name
- `controlNumber`: string - Voting control number
- `shares`: bigint - Number of shares held
- `sharesVoted`: bigint - Shares already voted
- `voteStatus`: string - Voting status
- `dateVoted`: Date - Vote submission date

**Seed Data Pattern**:

- Based on Wendy's CSV data patterns
- Mix of institutional ("CEDE & CO") and retail positions
- Realistic share distributions (large institutional, smaller retail)
- Varied voting participation rates by company and proposal type

### Proposal

**Purpose**: Meeting proposals with realistic voting outcomes

**Fields**:

- `id`: UUID - Primary key
- `meetingId`: string - Foreign key to Meeting
- `proposalNumber`: integer - Proposal sequence
- `proposalTitle`: string - Proposal description
- `proposalType`: string - Category of proposal
- `directorName`: string - For director elections
- `recommendation`: string - Board recommendation

**Seed Data Pattern**:

- Director election proposals (typically 8-12 per meeting)
- Standard proposals: auditor ratification, executive compensation
- Shareholder proposals: ESG, governance topics
- Realistic board recommendations (mostly "FOR")

### PositionVote

**Purpose**: Actual voting records with realistic patterns

**Fields**:

- `id`: UUID - Primary key
- `positionId`: UUID - Foreign key to Position
- `proposalId`: UUID - Foreign key to Proposal
- `vote`: string - Vote decision (FOR, AGAINST, ABSTAIN)
- `sharesVoting`: bigint - Shares cast for this vote

**Seed Data Pattern**:

- High support for director elections (85-95% FOR)
- Strong support for auditor ratification (95%+ FOR)
- Mixed results for shareholder proposals (varies by topic)
- Abstention rates varying by proposal type

### Comment

**Purpose**: Document collaboration and review history

**Fields**:

- `id`: bigint - Primary key
- `documentId`: UUID - Foreign key to Document
- `userId`: UUID - Foreign key to User
- `comment`: text - Comment content
- `firstName`: string - Commenter first name
- `lastName`: string - Commenter last name

**Seed Data Pattern**:

- Review comments on draft documents
- Approval confirmations
- Questions and clarifications
- Realistic collaboration patterns

## Data Relationships

```
Account (1) ──── (n) User
   │
   └── (1) ──── (n) Meeting ──── (n) Phase ──── (n) Task
                   │               └── (n) PhaseKeyDate
                   ├── (n) Document ──── (n) Comment
                   ├── (n) Position ──── (n) PositionVote
                   └── (n) Proposal ──── (n) PositionVote
```

## Data Volume Estimates

- **Accounts**: 5 total
- **Users**: 8-10 total
- **Meetings**: 4 total (1 per company)
- **Phases**: 32 total (8 per meeting)
- **PhaseKeyDates**: 60-80 total (~15-20 per meeting across phases)
- **Tasks**: 80-100 total (~20 per meeting)
- **Documents**: 20-30 total (5-8 per meeting)
- **Positions**: 10,000+ total (realistic shareholder base)
- **Proposals**: 40-50 total (~10-12 per meeting)
- **PositionVotes**: 100,000+ total (positions × proposals with voting)
- **Comments**: 50-100 total (document collaboration)

## Validation Rules

### Data Integrity

- All foreign key relationships must be valid
- PhaseKeyDate sequences must be logical (record date < mailing date < meeting date)
- Task due dates must align with phase key dates where applicable
- Share counts must be consistent (sharesVoted ≤ shares)
- Vote totals must match position shares

### Business Logic

- Quorum calculations based on shares outstanding
- Phase progression follows logical sequence
- Task assignments match user account relationships
- Document approval workflows follow realistic patterns

### Schema Compliance

- All generated data must match current Prisma schema exactly
- Enum values must use defined schema values
- Required fields cannot be null
- Unique constraints must be respected

## Seed Data Generation Strategy

1. **Create foundational data**: Accounts and Users first
2. **Generate meeting timelines**: Work backwards from meeting dates
3. **Create phase and task structures**: Based on meeting status
4. **Import position data**: Parse and adapt Wendy's CSV patterns
5. **Generate voting data**: Create realistic participation patterns
6. **Add collaboration history**: Comments and document workflows
7. **Validate data integrity**: Ensure all constraints are satisfied

This data model provides the foundation for comprehensive seed data that demonstrates all aspects of the shareholder meeting lifecycle while maintaining realistic patterns and relationships.
