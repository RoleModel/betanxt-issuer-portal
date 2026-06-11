# UI Contracts (no new API endpoints)

All remaining functional requirements are satisfied by frontend changes consuming existing endpoints. These UI contracts are validated by Playwright e2e specs (`issuer-portal/tests/e2e/`).

## C1 — Voting Activity chart (FR-001/FR-002)

- Component: `issuer-portal/components/Tabulation/VotingActivityCard.tsx`
- Contract: Title/caption explicitly state "Registered Holders"; series input filtered to `holderCategory === "REGISTERED"`; no tooltip or legend text implies full-population coverage.

## C2 — Shares Voted chart (FR-003–FR-006)

- Components: `SharesVotedCard.tsx` (+ `SharesVotedChart.tsx`)
- Data: `useVotingTabulation().proposals[]` (`proposalNumber`, `proposalTitle`, `totalVotesFor/Against/Abstain`)
- Contract:
  - Proposal `Select` lists all proposals ordered by `proposalNumber`; default = lowest.
  - Chart shows FOR/AGAINST/ABSTAIN shares for the selected proposal only.
  - Header displays "Proposal {n}: {title}".
  - Single-proposal meetings: selector visible but disabled; zero-vote proposals render an empty state.

## C3 — Total Votes removal (FR-007)

- Component: `issuer-portal/components/Meeting/VotingTabulationTable.tsx` (via `ProposalDetailsCard`)
- Contract: "Total Votes" column removed on the Tabulation view. Phase 6/7 layouts re-verified after removal.

## C4 — Reports dropdown + Broker Breakout (FR-008–FR-010)

- Components: `issuer-portal/components/Reporting/DownloadReportsTable.tsx`, new `BrokerBreakoutReport`
- Data: `GET /meetings/{meetingId}/tabulation-report` (existing) via `useReports.ts`
- Contract:
  - Report selection dropdown lists all legacy-parity reports + "Broker Breakout Report".
  - Every legacy report row is downloadable (no permanently disabled rows).
  - Broker Breakout columns: broker name, positions held, shares held, shares voted, % voted.

## C5 — Modernized report design (FR-011)

- Contract: All generated reports use the shared `@react-pdf/renderer` theme (brand colors, portal typography). Visual snapshot tests cover one report per template family.

## C6 — Reporting tab visualizations (FR-012)

- Page: `issuer-portal/app/[clientTicker]/reporting/page.tsx`
- Contract: `BrokerVotingChart`, `ParticipationChart`, `PositionsVotedChart`, `VotingPerformanceChart` are mounted and render with live data (currently orphaned components).

## C7 — Quorum timeline (FR-013–FR-015)

- Components: replace Early/Late columns in `QuorumPerformanceTable.tsx`; new `QuorumTimelineChart` (MUI X `LineChart`)
- Data: cumulative `Position.sharesVoted` by `dateVoted`; milestones from `Meeting` + additional mailings
- Contract:
  - X-axis is calendar time from mail date → meeting deadline.
  - Reference markers at mail date, each follow-up mailing, and the deadline.
  - No "Early Votes %" / "Late Votes %" segmentation remains.
  - Meetings without follow-ups show only mail-date and deadline markers.

## C8 — Geographic heat map (FR-016–FR-020)

- New component: `issuer-portal/components/Reporting/GeoHeatmapCard.tsx` (MUI X Charts Pro `Heatmap`)
- Data: `useGeoDistribution` aggregating `Position.state`/`country` × metric
- Contract:
  - Metric toggle: "Shareholders" | "Shares Held".
  - Population filter: Registered + Plan checked by default; NOBO checkbox enabled only when client has `"nobo"` feature.
  - Rows include "International" and "Unknown" buckets; "Unknown" discloses its count.

## C9 — NOBO tab (FR-021–FR-023)

- New route: `issuer-portal/app/[clientTicker]/meeting/[meetingId]/nobo/page.tsx`
- Tab registration: `EventTabs.tsx` with `featureGate: "nobo"`
- Contract:
  - Tab hidden for clients lacking the `"nobo"` feature key.
  - Page shows NOBO positions table (holder name, account number, shares, state).
  - Empty state when an Engage client has zero NOBO rows.
