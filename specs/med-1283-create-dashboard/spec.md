# Feature Specification: Create Supabase Seed Data and Docker Files

**Feature Branch**: `001-create-supabase-seed`  
**Created**: 2024-09-13  
**Status**: Draft  
**Input**: User description: "Create supabase seed data and Docker files Generate comprehensive seed data for the Issuer Portal to demonstrate the full shareholder meeting lifecycle. Ensure that all mock-server-routes match the prisma.schema. Create 3 companies with active meetings at different phases: The Wendy's Company. Paycom Software, Inc. Woodward, Inc. Enliven Therapeutics, Inc. Past event data for Wendy's can be found in data/ and should be used to generate similar seed data. For each company, generate realistic meeting dates working backwards from meeting date, document upload history with version tracking, task completion patterns showing some overdue and some completed items, user activity logs from relationship managers and issuer contacts, and approval workflows in various states. Need 5 accounts. Include 1 relationship manager account managing 5 companies, 4 issuer accounts with 1-2 users company account with different activity levels."

## Execution Flow (main)

```
1. Parse user description from Input
   → Extract companies, user types, data requirements
2. Extract key concepts from description
   → Identify: 5 accounts, 4 companies, meeting phases, document workflows
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → Demo scenarios for different meeting phases
5. Generate Functional Requirements
   → Seed data generation, Docker setup, API route matching
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → Validate completeness and clarity
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT seed data is needed and WHY
- ❌ Avoid HOW to implement (specific database queries, code structure)
- 👥 Written for business stakeholders to understand demo scenarios

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a product demo presenter, I need comprehensive seed data that showcases the complete shareholder meeting lifecycle across multiple companies at different phases, so that I can demonstrate the platform's capabilities to potential clients and stakeholders.

### Acceptance Scenarios

1. **Given** the system is seeded with data, **When** I navigate to the dashboard, **Then** I see 4 companies with meetings in different phases. Phase 1, Phase 2, Phase 6.
2. **Given** I'm logged in as a relationship manager, **When** I view my portfolio, **Then** I see all 4 assigned companies with their current meeting status
3. **Given** I'm logged in as an issuer user, **When** I access my company's meeting, **Then** I see my Phase 1 dashboard.
4. **Given** I view a meeting in the phase 1, **When** I click a task, **Then** I see the task drawer open with steps to complete.

### Edge Cases

- What happens when viewing meetings with no voting activity yet?
- How does the system display overdue tasks and their impact on meeting progression?
- What data is shown for completed meetings with full tabulation results?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST generate seed data for exactly 5 user accounts (1 relationship manager, 4 issuer accounts with 1-2 users each)
- **FR-002**: System MUST create 4 company accounts: The Wendy's Company, Paycom Software Inc, Woodward Inc, and Enliven Therapeutics Inc
- **FR-003**: System MUST generate meetings for each company in different phases: Planning, Active, Voting, and Completed
- **FR-004**: System MUST create realistic meeting timelines working backwards from meeting dates (record date, mailing date, meeting date)
- **FR-005**: System MUST generate document upload history with version tracking for each meeting phase
- **FR-006**: System MUST create task completion patterns showing realistic progress with some overdue and completed items
- **FR-007**: System MUST generate position and voting data based on Wendy's historical patterns from existing CSV data
- **FR-008**: System MUST create proposal data with realistic voting outcomes for different proposal types
- **FR-009**: System MUST generate user activity logs showing different engagement levels across companies
- **FR-011**: System MUST ensure all generated data matches the current Prisma schema structure
- **FR-012**: System MUST provide Docker configuration for easy database setup and seeding
- **FR-013**: System MUST generate comments and collaboration history on documents showing realistic review processes
- **FR-014**: System MUST create phase progression data showing how meetings advance through different stages
- **FR-015**: System MUST generate signature requirements and completion status for documents requiring authorization

### Key Entities _(include if feature involves data)_

- **Account**: Corporate issuer accounts and relationship manager account with appropriate user assignments
- **User**: Relationship managers, account admins, and issuer users with different activity levels and permissions
- **Meeting**: Shareholder meetings in various phases with realistic timelines and completion percentages
- **Phase**: Meeting phases (Planning, Document Prep, Mailing, Voting, Tabulation, Reporting) with appropriate dates and status
- **Task**: Phase-specific tasks with realistic completion patterns, due dates, and ownership
- **Document**: Meeting documents with version history, upload dates, and approval workflows
- **Position**: Shareholder positions based on Wendy's data patterns with realistic account types and voting eligibility
- **Proposal**: Meeting proposals with realistic voting outcomes and recommendation patterns
- **PositionVote**: Vote records showing realistic participation rates and voting patterns
- **Comment**: Document collaboration history showing realistic review and approval processes
- **Signature**: Document signature requirements and completion tracking

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
