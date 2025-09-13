# Data Model: Issuer Portal - Proxy Voting & Shareholder Meeting Management

## Core Entities

### Account

**Purpose**: Represents corporate accounts/issuers that manage shareholder meetings

**Fields**:

- `id`: string (UUID) - Primary key
- `account`: string - Unique account identifier
- `name`: string - Company/issuer name (unique)
- `primaryContact`: string (UUID) - Foreign key to User
- `createdAt`: DateTime - Account creation timestamp

**Relationships**:

- Has many Users (one-to-many)
- Has many Meetings (one-to-many)
- Belongs to one User as primary contact (many-to-one)

**Validation Rules**:

- Account identifier must be unique
- Name must be unique and 2-100 characters
- Primary contact must be a valid user

### User

**Purpose**: System users with different roles in the proxy voting process

**Fields**:

- `id`: string (UUID) - Primary key
- `username`: string - Unique username identifier
- `firstName`: string - User's first name
- `lastName`: string - User's last name
- `email`: string - Unique email address
- `password`: string - Hashed password
- `type`: UserType - User role/type enum
- `accountId`: string (UUID) - Foreign key to Account (optional for system admins)

**Relationships**:

- Belongs to one Account (many-to-one, optional)
- Writes many Comments (one-to-many)
- Is primary contact for Accounts (one-to-many)

**Validation Rules**:

- Username must be unique
- Email must be unique and valid format
- Password must meet security requirements
- Type must be valid UserType enum value

### Meeting

**Purpose**: Represents shareholder meetings requiring proxy voting

**Fields**:

- `id`: string - Primary key (meeting identifier)
- `title`: string - Meeting title/name
- `cusip`: string - CUSIP identifier for the security
- `ticker`: string - Stock ticker symbol
- `recordDate`: Date - Record date for shareholder eligibility
- `mailingDate`: Date - Date proxy materials are mailed
- `meetingDate`: Date - Actual meeting date
- `meetingType`: string - Type of meeting (Annual, Special, etc.)
- `meetingYear`: integer - Year of the meeting
- `status`: MeetingStatus - Current meeting status
- `currentPhase`: string - Current phase of the meeting process
- `overallCompletion`: integer - Percentage completion (0-100)
- `distributionType`: string - How materials are distributed
- `transferAgent`: string - Transfer agent name
- `employeeStockPlans`: string - Employee stock plan details
- `planAdministrator`: string - Plan administrator name
- `planAdministratorContact`: string - Contact person
- `planAdministratorContactEmail`: string - Contact email
- `solicitor`: string - Proxy solicitor firm
- `solicitorEmail`: string - Solicitor contact email
- `totalSharesOutstanding`: bigint - Total shares outstanding
- `quorumRequirement`: decimal - Quorum requirement percentage
- `accountId`: string (UUID) - Foreign key to Account
- `createdAt`: DateTime - Meeting creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Account (many-to-one)
- Has many Phases (one-to-many)
- Has many Documents (one-to-many)
- Has many Tasks (one-to-many)
- Has many Positions (one-to-many)
- Has many Proposals (one-to-many)
- Has many PhaseKeyDates (one-to-many)

**Validation Rules**:

- Meeting ID must be unique
- Record date must be before meeting date
- Mailing date must be after record date
- Quorum requirement must be between 0 and 100
- Total shares outstanding must be positive

### Phase

**Purpose**: Represents different phases of the meeting process (e.g., Planning, Mailing, Voting, Tabulation)

**Fields**:

- `id`: string (UUID) - Primary key
- `meetingId`: string - Foreign key to Meeting
- `name`: string - Phase name (e.g., "Planning", "Mailing", "Voting")
- `orderIndex`: integer - Order of phase in the process
- `status`: PhaseStatus - Current phase status
- `createdAt`: DateTime - Phase creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Meeting (many-to-one)
- Has many Tasks (one-to-many)
- Has many PhaseKeyDates (one-to-many)

**Validation Rules**:

- Order index must be unique within a meeting
- Name must be 2-50 characters
- Status must be valid PhaseStatus enum value

### Task

**Purpose**: Specific tasks within meeting phases (e.g., "Mail proxy materials", "Collect votes")

**Fields**:

- `id`: string (UUID) - Primary key
- `taskId`: string - Unique task identifier
- `phaseId`: string (UUID) - Foreign key to Phase
- `meetingId`: string - Foreign key to Meeting
- `phaseNumber`: integer - Phase number for quick reference
- `title`: string - Task title
- `description`: text - Detailed task description
- `type`: string - Task type/category
- `status`: TaskStatus - Current task status
- `dueDate`: Date - Task due date
- `owner`: string - Task owner/assignee
- `documentId`: string (UUID) - Foreign key to Document (optional)
- `links`: jsonb - Related links and resources
- `createdAt`: DateTime - Task creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Phase (many-to-one)
- Belongs to one Meeting (many-to-one)
- May generate one Document (one-to-one, optional)

**Validation Rules**:

- Task ID must be unique
- Title must be 3-200 characters
- Due date must be in the future (for active tasks)
- Owner must be a valid user

### Document

**Purpose**: Documents related to the meeting process (proxy statements, voting instructions, etc.)

**Fields**:

- `id`: string (UUID) - Primary key
- `meetingId`: string - Foreign key to Meeting
- `taskId`: string (UUID) - Foreign key to Task (optional)
- `title`: string - Document title
- `description`: text - Document description
- `type`: string - Document type (e.g., "Proxy Statement", "Voting Instruction")
- `filePath`: string - File storage path
- `fileType`: string - File MIME type
- `fileSize`: integer - File size in bytes
- `status`: DocumentStatus - Current document status
- `uploadDate`: DateTime - When document was uploaded
- `uploadedDate`: DateTime - Alternative upload timestamp
- `signedDate`: DateTime - When document was signed (optional)
- `authorizedDate`: DateTime - When document was authorized (optional)
- `completedDate`: DateTime - When document processing completed (optional)
- `inProgressDate`: DateTime - When document processing started (optional)
- `history`: jsonb - Document history and audit trail
- `createdAt`: DateTime - Document creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Meeting (many-to-one)
- May belong to one Task (many-to-one, optional)
- Has many Comments (one-to-many)
- Has many Signatures (one-to-many)

**Validation Rules**:

- Title must be 3-200 characters
- File path must be valid
- File size must be positive
- Status transitions must follow business rules

### Position

**Purpose**: Represents shareholder positions eligible to vote

**Fields**:

- `id`: string (UUID) - Primary key
- `meetingId`: string - Foreign key to Meeting
- `cusip`: string - CUSIP identifier
- `accountType`: string - Type of account holding shares
- `setKey`: string - Position set identifier
- `name`: string - Position holder name
- `accountNumber`: string - Account number
- `voteStatus`: string - Current voting status
- `controlNumber`: string - Unique control number for voting
- `shares`: bigint - Number of shares held
- `sharesVoted`: bigint - Number of shares already voted
- `source`: string - Source of position data
- `dateVoted`: Date - Date when votes were cast (optional)
- `sentBy`: string - Who sent the voting instructions
- `createdAt`: DateTime - Position creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Meeting (many-to-one)
- Has many PositionVotes (one-to-many)

**Validation Rules**:

- Control number must be unique within a meeting
- Shares must be non-negative
- Shares voted cannot exceed total shares
- Account number must be valid format

### Proposal

**Purpose**: Represents voting proposals/items for the meeting

**Fields**:

- `id`: string (UUID) - Primary key
- `meetingId`: string - Foreign key to Meeting
- `proposalNumber`: integer - Proposal number (1, 2, 3, etc.)
- `proposalTitle`: string - Title of the proposal
- `proposalType`: string - Type of proposal (e.g., "Director Election", "Advisory Vote")
- `proposalSubtype`: string - Subtype for more granular categorization
- `directorName`: string - Director name (for director elections)
- `directorTermYears`: integer - Term length in years
- `directorClass`: string - Director class (I, II, III)
- `termExpirationYear`: integer - When the term expires
- `frequencyOptions`: jsonb - Frequency options for advisory votes
- `recommendation`: string - Board recommendation (For, Against, etc.)
- `createdAt`: DateTime - Proposal creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Meeting (many-to-one)
- Has many PositionVotes (one-to-many)

**Validation Rules**:

- Proposal number must be unique within a meeting
- Title must be 5-500 characters
- Term years must be positive (for director elections)
- Recommendation must be valid option

### PositionVote

**Purpose**: Records votes cast by positions on specific proposals

**Fields**:

- `id`: string (UUID) - Primary key
- `positionId`: string (UUID) - Foreign key to Position
- `proposalId`: string (UUID) - Foreign key to Proposal
- `vote`: string - Vote cast (For, Against, Abstain, etc.)
- `sharesVoting`: bigint - Number of shares voting this way
- `createdAt`: DateTime - Vote timestamp

**Relationships**:

- Belongs to one Position (many-to-one)
- Belongs to one Proposal (many-to-one)

**Validation Rules**:

- Position and Proposal combination should be unique per vote type
- Shares voting must be positive
- Vote must be valid option (For, Against, Abstain, etc.)

### PhaseKeyDate

**Purpose**: Important dates within meeting phases

**Fields**:

- `id`: string (UUID) - Primary key
- `phaseId`: string (UUID) - Foreign key to Phase
- `meetingId`: string - Foreign key to Meeting
- `phaseNumber`: integer - Phase number for quick reference
- `dateName`: string - Name of the date (e.g., "Mailing Deadline", "Voting Cutoff")
- `dateValue`: Date - The actual date
- `isMandatory`: boolean - Whether this date is mandatory
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Phase (many-to-one)
- Belongs to one Meeting (many-to-one)

**Validation Rules**:

- Date name must be 3-100 characters
- Date value must be valid
- Mandatory dates cannot be null

### Comment

**Purpose**: Comments on documents for collaboration and review

**Fields**:

- `id`: bigint - Primary key
- `documentId`: string (UUID) - Foreign key to Document
- `userId`: string (UUID) - Foreign key to User
- `comment`: text - Comment content
- `firstName`: string - Commenter's first name (denormalized)
- `lastName`: string - Commenter's last name (denormalized)
- `createdAt`: DateTime - Comment timestamp

**Relationships**:

- Belongs to one Document (many-to-one)
- Belongs to one User (many-to-one)

**Validation Rules**:

- Comment must be 1-2000 characters
- User must exist and have access to the document

### Signature

**Purpose**: Digital signature fields on documents

**Fields**:

- `id`: string (UUID) - Primary key
- `documentId`: string (UUID) - Foreign key to Document
- `pageNumber`: integer - Page number where signature appears
- `xPosition`: double - X coordinate of signature field
- `yPosition`: double - Y coordinate of signature field
- `width`: double - Width of signature field
- `height`: double - Height of signature field
- `signatureType`: string - Type of signature required
- `required`: boolean - Whether signature is required
- `createdAt`: DateTime - Creation timestamp
- `updatedAt`: DateTime - Last modification timestamp

**Relationships**:

- Belongs to one Document (many-to-one)

**Validation Rules**:

- Page number must be positive
- Position and dimensions must be valid
- Signature type must be valid option

## Enums

### UserType

- `SYSTEM_ADMIN` - System administrator
- `ACCOUNT_ADMIN` - Account administrator
- `ISSUER_USER` - Regular issuer user
- `SOLICITOR` - Proxy solicitor
- `TRANSFER_AGENT` - Transfer agent user

### MeetingStatus

- `PLANNING` - Meeting in planning phase
- `ACTIVE` - Meeting is active/ongoing
- `COMPLETED` - Meeting completed successfully
- `CANCELLED` - Meeting was cancelled
- `ADJOURNED` - Meeting adjourned (didn't meet quorum)

### PhaseStatus

- `NOT_STARTED` - Phase not yet started
- `IN_PROGRESS` - Phase currently active
- `COMPLETED` - Phase completed
- `BLOCKED` - Phase blocked by dependencies

### TaskStatus

- `PENDING` - Task not yet started
- `IN_PROGRESS` - Task currently being worked on
- `COMPLETED` - Task finished
- `OVERDUE` - Task past due date
- `CANCELLED` - Task cancelled

### DocumentStatus

- `DRAFT` - Document in draft state
- `UPLOADED` - Document uploaded
- `IN_PROGRESS` - Document being processed
- `SIGNED` - Document signed
- `AUTHORIZED` - Document authorized
- `COMPLETED` - Document processing complete

## State Transitions

### Meeting Status Flow

```
PLANNING → ACTIVE → COMPLETED
    ↓         ↓
CANCELLED ← CANCELLED
    ↓
ADJOURNED (from ACTIVE only)
```

### Phase Status Flow

```
NOT_STARTED → IN_PROGRESS → COMPLETED
      ↓             ↓
   BLOCKED ←── BLOCKED
```

### Document Status Flow

```
DRAFT → UPLOADED → IN_PROGRESS → SIGNED → AUTHORIZED → COMPLETED
  ↓         ↓           ↓          ↓         ↓
CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED ← CANCELLED
```

## Database Indexes

### Performance Indexes

- `account.account` (unique)
- `account.name` (unique)
- `user.username` (unique)
- `user.email` (unique)
- `meeting.cusip`
- `meeting.ticker`
- `meeting.meetingDate`
- `meeting.status`
- `position.meetingId`
- `position.controlNumber`
- `proposal.meetingId`
- `proposal.proposalNumber`
- `positionVote.positionId`
- `positionVote.proposalId`
- `document.meetingId`
- `task.meetingId`
- `task.phaseId`

### Composite Indexes

- `position(meetingId, controlNumber)` (unique)
- `proposal(meetingId, proposalNumber)` (unique)
- `positionVote(positionId, proposalId, vote)` (unique)
- `phase(meetingId, orderIndex)` (unique)
- `task(meetingId, taskId)` (unique)

## Data Relationships Summary

```
Account ──┐
          ├── User (primary contact)
          └── Meeting ──┐
                        ├── Phase ──┐
                        │           ├── Task ──── Document ──┐
                        │           └── PhaseKeyDate        ├── Comment ──── User
                        ├── Position ──── PositionVote      └── Signature
                        ├── Proposal ──── PositionVote
                        ├── Document
                        ├── Task
                        └── PhaseKeyDate
```

## Seed Data Requirements

### Default User Types

- System Admin (full system access)
- Account Admin (account-level management)
- Issuer User (standard user within account)
- Solicitor (proxy solicitation functions)
- Transfer Agent (position management)

### Default Meeting Phases

1. **Planning** - Initial meeting setup and preparation
2. **Document Preparation** - Proxy statement and material creation
3. **Mailing** - Distribution of proxy materials
4. **Voting Period** - Active voting collection
5. **Tabulation** - Vote counting and verification
6. **Reporting** - Final results and documentation

### Default Task Types

- Document creation and review
- Regulatory filing
- Material distribution
- Vote collection
- Compliance verification
- Results tabulation
