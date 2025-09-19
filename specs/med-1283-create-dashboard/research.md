# Research: Seed Data Generation and Docker Setup

## Research Tasks Completed

### 1. CSV Data Analysis from Wendy's Historical Data

**Decision**: Use existing Wendy's CSV files as templates for realistic data patterns  
**Rationale**: Historical data provides authentic voting patterns, shareholder distribution, and proposal structures  
**Alternatives considered**:

- Synthetic random data generation (rejected - unrealistic patterns)
- Manual data creation (rejected - time-intensive and less realistic)

**Key Findings from Wendy's Data**:

- CUSIP: 95058W100 (Wendy's identifier)
- Account types: "CEDE & CO / CTC & CO", "Registered Account"
- Vote sources: "WEB" for online voting
- Voting patterns: High participation for board elections, mixed results for shareholder proposals
- Share distributions: Large institutional holders (millions) vs individual shareholders (thousands)
- Proposal types: Board elections (1.01-1.10), Auditor ratification, Executive compensation, ESG proposals

### 2. Prisma Schema Compatibility Research

**Decision**: Generate seed data that exactly matches current Prisma schema structure  
**Rationale**: Ensures data integrity and prevents constraint violations  
**Alternatives considered**:

- Schema modifications to fit data (rejected - outside scope)
- Partial data generation (rejected - incomplete demo experience)

**Key Schema Requirements**:

- Account model: id, account, name, primaryContact, createdAt
- User model: id, username, firstName, lastName, email, password, type, accountId
- Meeting model: Complex with 20+ fields including dates, shares, quorum requirements
- Phase model: Now includes direct date fields (startDate, endDate, dueDate, completionDate)
- Position model: Maps to CSV data structure with shares, controlNumber, voteStatus
- Proposal model: Supports director elections and shareholder proposals
- PositionVote model: Records actual voting decisions with share counts

### 3. Docker Configuration Best Practices

**Decision**: Use docker-compose with PostgreSQL service and seed initialization  
**Rationale**: Provides consistent development environment and automated database setup  
**Alternatives considered**:

- Local PostgreSQL installation (rejected - environment inconsistency)
- SQLite for development (rejected - production uses PostgreSQL)

**Docker Setup Requirements**:

- PostgreSQL 15+ container with persistent volume
- Environment variable configuration for database URLs
- Seed script execution on container startup
- Network configuration for API server connection

### 4. Realistic Timeline Generation Strategy

**Decision**: Work backwards from meeting dates using industry-standard timelines  
**Rationale**: Creates authentic meeting preparation schedules  
**Alternatives considered**:

- Random date generation (rejected - unrealistic timelines)
- Fixed date offsets (rejected - less realistic variation)

**Timeline Patterns**:

- Search the web for Notice and Access SEC timeline

### 5. Company-Specific Data Patterns

**Decision**: Create distinct data patterns for each company based on industry and size  
**Rationale**: Demonstrates platform flexibility across different client types

**Company Profiles**:

- **Wendy's Company**: Fast food, large public company, high retail participation
- **Paycom Software**: Tech company, concentrated ownership, employee stock plans
- **Woodward Inc**: Industrial, institutional-heavy ownership, governance focus
- **Enliven Therapeutics**: Biotech, smaller company, activist investor scenarios

### 6. Task Completion Pattern Research

**Decision**: Create realistic task completion patterns with some overdue items  
**Rationale**: Demonstrates real-world project management scenarios

**Task Patterns**:

1. [Phase 1: Project Launch & Data Check]
2. [Phase 2: Broker Search, Authorizations, and Proxy Card Notice]
3. [Phase 3: Approaching Record Date, Proxy Card Readiness]
4. [Phase 4: Shareholder Record File delivery expectations]
5. [Phase 5: Pre-Mail Date]
6. [Phase 6: Post Mail Date – Pre-Vote & Tabulation Reporting]
7. [Phase 7: Tabulation Report & Meeting Details]
8. [Phase 8: Registered Vote Report]

### 7. User Activity Level Simulation

**Decision**: Generate varied user engagement patterns based on role types  
**Rationale**: Shows realistic user behavior differences

**Activity Patterns**:

- Relationship Manager: High activity across all companies
- Account Admins: Focused activity on their company
- Issuer Users: Task-specific activity with varying engagement
- System activity: Automated task updates and status changes

## Implementation Approach

Based on research findings, the seed data generation will:

1. **Parse Wendy's CSV data** to extract realistic patterns for positions and votes
2. **Generate company-specific variations** while maintaining authentic data distributions
3. **Create time-based workflows** with realistic phase progression and task completion
4. **Implement Docker setup** with automated seeding and database initialization
5. **Ensure schema compliance** through validation tests before data insertion
6. **Generate user activity logs** to simulate realistic platform usage over time

## Dependencies Confirmed

- **Prisma Client**: For type-safe database operations
- **csv-parser**: For processing Wendy's historical data
- **faker.js**: For generating realistic names and contact information
- **date-fns**: For timeline calculations and date manipulation
- **Docker & docker-compose**: For containerized database setup
- **PostgreSQL 15+**: Database engine matching production environment

All research tasks completed successfully with no remaining NEEDS CLARIFICATION items.
