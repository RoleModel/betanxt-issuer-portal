# Quickstart: Seed Data Generation and Demo Setup

## Overview

This quickstart guide walks through setting up the Issuer Portal with comprehensive seed data for demonstration purposes. The seed data includes 4 companies in different meeting phases with realistic shareholder data based on historical patterns.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Git repository cloned locally

## Quick Start (5 minutes)

### 1. Start the Database

```bash
# From repository root
cd mock-api-server
docker-compose up -d postgres
```

### 2. Generate Seed Data

```bash
# Install dependencies
npm install

# Generate comprehensive seed data
npm run db:seed

# Verify data generation
npm run db:validate
```

### 3. Start the Application

```bash
# Terminal 1: Start mock API server
cd mock-api-server
npm run dev

# Terminal 2: Start frontend (in separate terminal)
cd issuer-portal
npm run dev
```

### 4. Access Demo Data

Navigate to `http://localhost:3000` and login with:

**Relationship Manager Account:**

- Username: `sarah.johnson`
- Password: `demo123`
- Role: System Admin (can view all companies)

**Issuer Accounts:**

- Wendy's: `mike.chen` / `demo123` (Account Admin)
- Paycom: `lisa.rodriguez` / `demo123` (Issuer User)
- Woodward: `david.kim` / `demo123` (Account Admin)
- Enliven: `jenny.patel` / `demo123` (Issuer User)

## Task Structure Overview

The seed data includes realistic tasks based on actual proxy voting workflows:

**Task Ownership:**

- **Issuer Tasks**: Client responsibilities (authorizations, file requests, deliverables)
- **BetaNXT Tasks**: Service provider responsibilities (processing, reporting, logistics)

**Task Status Types:**

- ✅ **COMPLETE**: Task finished successfully
- ⏳ **PENDING**: Task waiting to be started
- 🔒 **NEEDS_AUTHORIZATION**: Task blocked pending approval
- ❌ **INCOMPLETE**: All Tasks begin in this status.

**Phase-Specific Tasks:**

- **Phase 1-2**: Setup and authorization tasks
- **Phase 3-4**: File processing and document preparation
- **Phase 5-6**: Mailing and distribution activities
- **Phase 7-8**: Tabulation, reporting, and final filings

## Demo Scenarios

### Scenario 1: Active Meeting Management (Wendy's)

**Login as:** `mike.chen`  
**Company:** The Wendy's Company  
**Meeting Status:** ACTIVE (Phase 6: Special Meeting - Tabulation & Reporting)

**Demo Flow:**

1. **Dashboard Overview**: Meeting in Phase 6 with 75% completion showing Special Meeting workflow
2. **Review Tabulation on Dashboard**: Access live tabulation data and voting progress
3. **Confirm Advanced Proxy Statements**: Review and approve advanced proxy statement versions
4. **Export Tabulation Report**: Generate and download current voting results
5. **View Reports Tab**: Navigate to comprehensive reporting section with:
   - Real-time voting participation rates
   - Proposal-by-proposal breakdowns
   - Shareholder engagement metrics
6. **Confirm DSM Details**: Review Digital Shareholder Meeting setup and logistics
7. **Previous Years DSM Docs**: Access historical meeting documentation for comparison

**Key Metrics:**

- Total Positions: ~2,500 shareholders
- Shares Outstanding: 176,618,508
- Voting Participation: ~65% (realistic for active voting)
- Proposals: 16 total (10 directors + 6 shareholder proposals)

### Scenario 2: Early Planning (Paycom)

**Login as:** `lisa.rodriguez`  
**Company:** Paycom Software, Inc.  
**Meeting Status:** PLANNING (Phase 1: Annual Meeting - Setup & Authorization)

**Demo Flow:**

1. **Dashboard Overview**: Meeting in Phase 1 with 0% completion showing Annual Meeting setup
2. **Lead Details Confirmation**: Review and confirm key meeting stakeholders and contacts
3. **Authorizations Setup**: Navigate through authorization workflow:
   - DTCC authorization requests
   - Transfer agent confirmations
   - Broadridge/ICS access setup
4. **Confirm Transfer Agent**: Validate transfer agent details and contact information
5. **Step Transfer Agent form**: Complete transfer agent request forms
6. **Step Plan File Request form**: Submit plan file requests for employee stock plans
7. **Stmt Preparation form**: Begin statement preparation documentation
8. **Work DTCC Authorization**: Process DTCC authorization requirements
9. **Review Calendar**: Set up meeting timeline and key milestone dates
10. **Export Timeline**: Generate project timeline for stakeholder review
11. **Event Overview Screen**: Access comprehensive meeting setup dashboard

**Key Features:**

- Comprehensive authorization workflow management
- Transfer agent integration and validation
- DTCC and regulatory compliance setup
- Timeline and calendar management
- Multi-step form processing and validation

### Scenario 3: Document Review Phase (Woodward)

**Login as:** `david.kim`  
**Company:** Woodward, Inc.  
**Meeting Status:** IN_PROGRESS (Phase 2: Annual Meeting - Document Upload & Review)

**Demo Flow:**

1. **Dashboard Overview**: Meeting in Phase 2 focused on document upload and review/approve workflow
2. **Document Upload/Approvals**: Access document management center with upload capabilities
3. **Calendar View Upload**: Review document submission timeline and deadlines
4. **Draft Proxy Statement**: Review and edit draft proxy statement versions (already scheduled)
5. **Proxy Card Review Checklist**: Complete proxy card review and approval process
6. **Notice and Access Form**: Process Notice and Access compliance documentation (Magazine Draft)
7. **Amendments Review**: Review any required amendments to meeting materials
8. **Status Change Workflow**: Navigate through document approval status changes
9. **Final Document Package**: Compile final approved documents for distribution

**Key Features:**

- Document upload and version control
- Multi-stage approval workflows
- Calendar-based deadline management
- Draft review and amendment tracking
- Notice and Access compliance processing

### Scenario 4: Final Reporting Phase (Enliven)

**Login as:** `jenny.patel`  
**Company:** Enliven Therapeutics, Inc.  
**Meeting Status:** COMPLETED (Phase 8: Final Activities & Reporting)

**Demo Flow:**

1. **Dashboard Overview**: Meeting in Phase 8 showing comprehensive final activities workflow
2. **Income Execution**: Review meeting financial summary and cost analysis
3. **Shareholder Protections**: Access shareholder rights and protection documentation
4. **Account Level Reporting**: Generate account-level analytics and performance metrics
5. **Post Events Management**: Navigate post-meeting activities and follow-up tasks
6. **Tabulation Final Review**: Access complete tabulation results and voting analysis
7. **DSM Board List**: Review Digital Shareholder Meeting attendee list and participation
8. **Agenda Management**: Access final meeting agenda and minutes
9. **Mailing Summary**: Review final mailing statistics and delivery confirmation
10. ## **Reports Dashboard**: Comprehensive reporting center with:
    - Tabulation Tracker
    - Key Dates
    - Tasks
    - Meeting Information
    - Tabs for
      - Meeting Dashboard
      - Calendar
      - Documents
      - Mailing
      - Tabulation
      - Reports
      - Agenda
      - Guests/Registrants

**Key Features:**

- Comprehensive final reporting and analytics
- Post-meeting activity management
- Financial and cost analysis reporting
- Digital Shareholder Meeting (DSM) administration
- Regulatory compliance and filing management
- Multi-dimensional performance metrics

### Scenario 5: Relationship Manager Overview

**Login as:** `sarah.johnson`  
**Company:** All Companies (Portfolio View)  
**Role:** Relationship Manager

**Demo Flow:**

1. Portfolio dashboard with all 4 companies
2. Cross-company analytics and trends
3. Resource allocation across meetings
4. Risk management and oversight
5. Client relationship tracking
6. Performance metrics across portfolio

**Key Features:**

- Multi-company management
- Portfolio-level analytics
- Resource optimization
- Client relationship management

## Data Validation Tests

### Test 1: Schema Compliance

```bash
npm run test:schema
```

**Expected:** All generated data matches Prisma schema constraints

### Test 2: Business Logic Validation

```bash
npm run test:business-rules
```

**Expected:**

- Vote totals match share counts
- Date sequences are logical
- Quorum calculations are correct

### Test 3: API Compatibility

```bash
npm run test:api-routes
```

**Expected:** All API endpoints return valid data for generated records

### Test 4: Data Relationships

```bash
npm run test:relationships
```

**Expected:** All foreign key relationships are valid and complete

## Troubleshooting

### Database Connection Issues

```bash
# Check database status
docker-compose ps

# View database logs
docker-compose logs postgres

# Reset database if needed
docker-compose down
docker-compose up -d postgres
```

### Seed Data Issues

```bash
# Clear and regenerate data
npm run db:reset
npm run db:seed

# Check for constraint violations
npm run db:validate --verbose
```

### API Server Issues

```bash
# Check server logs
npm run dev

# Verify API endpoints
curl http://localhost:3001/api/accounts
curl http://localhost:3001/api/meetings
```

## Advanced Configuration

### Custom Company Configuration

Edit `mock-api-server/prisma/seed-config.json`:

```json
{
  "companies": [
    {
      "name": "Custom Company Inc.",
      "ticker": "CUST",
      "cusip": "12345678",
      "phase": "ACTIVE",
      "meetingDate": "2024-06-15"
    }
  ],
  "userCount": 10,
  "positionCount": 5000
}
```

### Historical Data Customization

Replace CSV files in `data/` directory with your own historical voting patterns.

### Docker Environment Variables

Configure in `mock-api-server/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/issuer_portal"
DIRECT_URL="postgresql://postgres:password@localhost:5432/issuer_portal"
SEED_RANDOM_SEED=12345
SEED_POSITION_COUNT=10000
```

## Success Criteria

After completing this quickstart, you should have:

- ✅ 5 user accounts with different roles and access levels
- ✅ 4 companies with meetings in different phases
- ✅ 10,000+ realistic shareholder positions
- ✅ Complete document workflows with version history
- ✅ Realistic task completion patterns with some overdue items
- ✅ Voting data based on historical Wendy's patterns
- ✅ User activity logs showing varied engagement levels
- ✅ Working API endpoints matching the Prisma schema

## Next Steps

1. **Explore the UI**: Navigate through different user roles and company phases
2. **Test API Endpoints**: Use the generated data to validate API functionality
3. **Customize Data**: Modify seed configuration for specific demo scenarios
4. **Performance Testing**: Validate system performance with realistic data volumes
5. **Integration Testing**: Ensure all components work together with seed data

This seed data provides a comprehensive foundation for demonstrating all aspects of the Issuer Portal platform to potential clients and stakeholders.
