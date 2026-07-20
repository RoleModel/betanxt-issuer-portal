# Feature Specification: Tabulation, Reporting & Data Visualization Enhancements

**Feature Branch**: `002-tabulation-enhancements` **Created**: 2026-06-11 **Status**: Draft **Input**: User description: "Tabulation Enhancements — clarify Registered Holder labeling on Voting Activity chart; redesign Shares Voted chart to be proposal-driven with a proposal selector; remove redundant Total Votes section. Reporting Enhancements — ensure legacy report parity, add Broker Breakout Report, modernize report design, expand Reporting Tab analytics. Data Visualization Improvements — replace Early/Late quorum segmentation with a timeline-based visualization across mailing milestones; add geographic heat map for shareholder count and shares held by location with Registered/Plan default and optional NOBO. NOBO Tab — optional Engage-gated module showing NOBO positional data with future reports/visualizations."

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

An issuer or CSM user reviewing a shareholder meeting opens the Tabulation view to understand vote progress. They see clearly labeled charts that distinguish Registered Holder data from full-population data, can drill into FOR/AGAINST/ABSTAIN results per proposal, and view vote accumulation over time against mailing milestones. From the Reporting tab, they access all reports previously available in legacy systems — including a new Broker Breakout Report — in a modernized format consistent with the portal's design. For clients with Engage enabled, a NOBO tab exposes beneficial-holder positional data, and a geographic heat map shows where shareholders and shares are concentrated.

### Acceptance Scenarios

1. **Given** a meeting with voting activity, **When** a user views the Voting Activity chart, **Then** the chart labeling explicitly states the data reflects Registered Holder voting only.
2. **Given** a meeting with multiple proposals, **When** a user opens the Shares Voted chart, **Then** Proposal 1 is shown by default and a proposal selector lists all proposals for the meeting.
3. **Given** the Shares Voted chart is displaying Proposal 1, **When** the user selects Proposal 2 from the selector, **Then** the chart updates to show FOR/AGAINST/ABSTAIN data for Proposal 2 with clear proposal-specific labeling.
4. **Given** the Tabulation view, **When** a user reviews the page, **Then** no "Total Votes" section is present.
5. **Given** the Reporting section, **When** a user browses available reports, **Then** every report available in legacy systems is accessible, and the Broker Breakout Report is selectable from a dropdown.
6. **Given** any report in the portal, **When** a user generates or views it, **Then** its visual formatting matches the portal's modern design standards.
7. **Given** a meeting with a known mail date and meeting deadline, **When** a user views the Quorum Performance chart, **Then** vote accumulation is displayed on a timeline across mail date, applicable intermediate dates, and the meeting/vote deadline (replacing Early vs. Late segmentation).
8. **Given** a meeting with Registered and Plan holders, **When** a user opens the Geographic Heat Map, **Then** they can toggle between shareholder count by location and shares held by location, with Registered and Plan populations included by default.
9. **Given** a client with NOBO data available, **When** a user views the Geographic Heat Map, **Then** they can optionally include NOBO data in the visualization.
10. **Given** a client with Engage functionality active, **When** a user views the meeting navigation, **Then** a NOBO tab is visible and displays NOBO positional data.
11. **Given** a client without Engage functionality, **When** a user views the meeting navigation, **Then** the NOBO tab is not visible.

### Edge Cases

- What happens when a meeting has only one proposal? The proposal selector should still render (or gracefully collapse) and default to that proposal.
- What happens when a proposal has zero votes recorded? The Shares Voted chart should display an empty/zero state rather than an error.
- How does the quorum timeline render when no follow-up (intermediate) mailings exist? Only mail date and meeting deadline milestones should appear.
- How does the heat map handle shareholders with missing or unparseable location data? These should be aggregated into an "Unknown" bucket or excluded with a count disclosed.
- What happens when NOBO data is expected but unavailable for an Engage-enabled client? The NOBO tab should show an explanatory empty state, not an error.
- How are reports handled for meetings that predate the new report formats? Regenerate any historical reports.

## Requirements _(mandatory)_

### Functional Requirements

#### Tabulation — Voting Activity Chart

- **FR-001**: The Voting Activity chart MUST display labeling that explicitly indicates the data reflects Registered Holder voting only.
- **FR-002**: The Voting Activity chart MUST NOT imply full-population (Beneficial Web vs. Print) coverage anywhere in its title, legend, or tooltips.

#### Tabulation — Shares Voted Chart

- **FR-003**: The Shares Voted chart MUST operate at the individual proposal level, displaying FOR/AGAINST/ABSTAIN data for a single proposal at a time.
- **FR-004**: The Shares Voted chart MUST include a proposal selector (dropdown) listing all proposals for the meeting.
- **FR-005**: The Shares Voted chart MUST default to Proposal 1 when first displayed.
- **FR-006**: The Shares Voted chart MUST clearly communicate which proposal is being displayed (e.g., proposal number and title in the chart header) to avoid misinterpretation.

#### Tabulation — Total Votes Section

- **FR-007**: The "Total Votes" section MUST be removed from the Tabulation view.

#### Reporting — Availability

- **FR-008**: All reports currently available in legacy systems MUST remain accessible in the portal. [NEEDS CLARIFICATION: definitive inventory of legacy reports to guarantee parity against]
- **FR-009**: A new Broker Breakout Report MUST be available via a dropdown selection within the reports section.
- **FR-010**: The Broker Breakout Report structure MUST be adapted to support non-ADR workflows in addition to its current ADR-processing use. [NEEDS CLARIFICATION: which fields/sections differ between ADR and non-ADR variants?]

#### Reporting — Design Modernization

- **FR-011**: All reports MUST receive a visual and formatting refresh aligned with the portal's modern UI/UX standards, delivered prior to or in parallel with the Issuer Portal release.

#### Reporting — Tab Enhancements

- **FR-012**: The Reporting Tab MUST be expanded to include additional insightful and actionable data visualizations. [NEEDS CLARIFICATION: which specific visualizations/metrics are required for the first release?]

#### Data Visualization — Quorum Performance Chart

- **FR-013**: The Quorum Performance chart MUST replace Early vs. Late vote segmentation with a timeline-based visualization.
- **FR-014**: The quorum timeline MUST display vote accumulation across key event milestones: mail date, intermediate dates (as applicable, e.g., follow-up mailings), and the meeting/vote deadline.
- **FR-015**: The quorum timeline MUST make the impact of follow-up mailings or reminder campaigns visually evaluable (vote accumulation visible before and after each milestone).

#### Data Visualization — Geographic Heat Map

- **FR-016**: The portal MUST provide a geographic heat map visualization supporting two metrics: shareholder count by location and shares held by location.
- **FR-017**: The heat map MUST include Registered and Plan populations by default.
- **FR-018**: The heat map MUST support optional inclusion of NOBO data when available for the client.
- **FR-019**: The heat map MUST handle records with missing location data without failing. Will need seeded data so that all records have location data.
- **FR-020**: The heat map MUST define its geographic granularity. Geography by state. Will need seeded data.

#### NOBO Tab (Optional / Upsell)

- **FR-021**: A NOBO Tab MUST be available only when Engage functionality is active for the client. This will be a flag set by CSM users in teh event Edit page.
- **FR-022**: The NOBO Tab MUST display NOBO positional data.
- **FR-023**: NOBO-specific reports and visualizations are to be evaluated and defined in a future iteration; the initial release MUST NOT block on them. Use the existing fields.

### Key Entities

- **Proposal**: A votable item within a meeting (e.g., Proposal 1, Proposal 2); has a number, title, and per-proposal FOR/AGAINST/ABSTAIN share counts.
- **Vote Record / Position**: A shareholding with vote status; the source of shares-voted and voting-activity aggregations; attributed to a holder population (Registered, Plan, Beneficial, NOBO).
- **Holder Population**: Classification of shareholders — Registered, Plan, Beneficial (Web/Print), NOBO — determining which charts and tabs include them.
- **Mailing Milestone**: A dated event in a meeting's mailing lifecycle (mail date, follow-up/intermediate mailings, meeting/vote deadline) anchoring the quorum timeline.
- **Report**: A generated document available from the Reporting section; includes legacy-parity reports and the new Broker Breakout Report; carries a modernized visual format.
- **Shareholder Location**: Geographic attribute of a holder used by the heat map; aggregates shareholder counts and shares held.
- **Engage Entitlement**: Client-level capability flag that gates visibility of the NOBO Tab and NOBO data inclusion.

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous (where not marked)
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
- [ ] Review checklist passed (pending clarifications)

---
