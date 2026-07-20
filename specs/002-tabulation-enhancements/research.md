# Phase 0 Research: Tabulation, Reporting & Data Visualization Enhancements

**Branch**: `002-tabulation-enhancements` | **Date**: 2026-06-11 **Input**: `specs/002-tabulation-enhancements/spec.md` (8 `[NEEDS CLARIFICATION]` markers)

Each unknown from the spec is resolved below with a decision, rationale, and alternatives considered. Decisions are scoped to the prototype/mock-data nature of this portal.

---

## R1. Historical report formats (spec edge case)

**Question**: Do historical reports get regenerated in the new design, or remain in their original format?

- **Decision**: All reports are rendered on demand from live data (`@react-pdf/renderer` / table components), so every report — historical or current — automatically uses the modernized design. No regeneration step exists or is needed.
- **Rationale**: `DownloadReportsTable` and `exportTabulationPdf` generate output at click time; there is no stored report artifact to migrate (except seeded `.xls` files for `wen-annual-meeting-2025`, which remain as-is).
- **Alternatives considered**: Batch-regenerating stored PDFs — rejected; no stored PDFs exist in the system.

## R2. Legacy report inventory (FR-008)

**Question**: What is the definitive inventory of legacy reports to guarantee parity against?

- **Decision**: Parity scope = the report list currently enumerated in `issuer-portal/components/Reporting/DownloadReportsTable.tsx` (`MOCK_REPORTS`) plus the Preliminary/Final Tabulation PDF (`exportTabulationPdf`). These represent the legacy-system reports already identified by product. All `MOCK_REPORTS` entries that are currently disabled must become downloadable (mock content acceptable).
- **Rationale**: The mock table was seeded from the legacy report list; no other inventory source exists in the repo. Making disabled rows functional satisfies "remain accessible."
- **Alternatives considered**: Waiting on an external legacy-system audit — rejected for prototype; can be appended later without structural change.

## R3. Broker Breakout Report structure (FR-009/FR-010)

**Question**: Which fields/sections differ between ADR and non-ADR variants?

- **Decision**: Build one generic Broker Breakout Report driven by the existing `GET /meetings/{meetingId}/tabulation-report` broker voting data (already consumed by `useReports.ts` and the unwired `BrokerVotingChart`). Columns: broker name, positions held, shares held, shares voted, % voted. ADR-specific columns (depositary, ratio) are omitted; the structure is workflow-agnostic, satisfying "adapt for non-ADR workflows."
- **Rationale**: Broker-level data already exists in the API; the non-ADR adaptation is achieved by _not_ hard-coding ADR concepts rather than by branching report variants.
- **Alternatives considered**: Two report variants (ADR vs non-ADR) — rejected; no ADR fields exist in the data model and the spec calls for adaptation, not duplication.

## R4. Reporting Tab visualizations (FR-012)

**Question**: Which specific visualizations are required for the first release?

- **Decision**: Wire the existing orphaned chart components into the Reporting surfaces: `BrokerVotingChart`, `ParticipationChart`, `PositionsVotedChart`, `VotingPerformanceChart` (client Reporting tab), reusing data already computed by `useReports.ts` / `useReporting.ts`. This is the "more insightful and actionable" set for v1.
- **Rationale**: Components and data plumbing already exist but are not mounted — lowest-cost path to a meaningfully richer Reporting tab.
- **Alternatives considered**: Designing net-new visualizations — deferred to a later iteration once stakeholders react to the wired set.

## R5. Quorum timeline data source (FR-013–FR-015)

**Question** (implicit): Where do milestone dates and vote accumulation come from?

- **Decision**: Compute client-side from data already fetched: cumulative `Position.sharesVoted` ordered by `Position.dateVoted` (line series), overlaid with milestone reference markers — meeting mail date, follow-up mailing dates (from the Additional Mailing data), and meeting date/vote deadline (from `Meeting`). Rendered with MUI X Charts `LineChart` + reference lines. Replaces Early/Late columns in `QuorumPerformanceTable`.
- **Rationale**: `dateVoted` is already used for the Early/Late calculation in `useReporting.calculateQuorumData()`; no new endpoint is required.
- **Alternatives considered**: New `/meetings/{id}/vote-timeline` endpoint — rejected; positions are already fetched and aggregation is trivial client-side.

## R6. Geographic heat map — granularity, missing data, and rendering (FR-016–FR-020)

**Questions**: Geographic granularity? Missing-location handling? Chart technology?

- **Decision — granularity**: US state-level, with a single "International" bucket for non-US holders. Resolves FR-020.
- **Decision — missing data**: Aggregate into an "Unknown" row with disclosed count (not silently excluded). Resolves FR-019.
- **Decision — rendering**: [MUI X Charts Heatmap](https://mui.com/x/react-charts/heatmap/) (`@mui/x-charts-pro`), as referenced in the feature request: states on the y-axis, metric (shareholder count / shares held) intensity via `zAxis` continuous color map, with a metric toggle and population checkboxes (Registered+Plan default, NOBO optional). MUI X Pro components are already sanctioned by the constitution (Principle VI).
- **Decision — data**: `Position` gains `state` and `country` fields (schema-first OpenAPI change + seed data), since no location fields exist today.
- **Alternatives considered**: True choropleth map (e.g., react-simple-maps) — rejected for v1; adds a new dependency, while the MUI X heatmap matches the requested reference and the existing chart stack.

## R7. Engage entitlement / NOBO tab gating (FR-021)

**Question**: How is "Engage active" determined per client?

- **Decision**: Extend the existing client feature-gating mechanism: add `"nobo"` to `ClientFeatureKey` (`issuer-portal/hooks/useClients.ts`) and to `enabledFeatures` on the `Client` API schema. The NOBO tab is registered in `EventTabs.ALL_NAVIGATION_TABS` with `featureGate: "nobo"`. Engage-enabled clients get `"nobo"` in their seeded `enabledFeatures`.
- **Rationale**: `EventTabs` already filters tabs by `useClientFeatures().isEnabled(featureGate)` — this is the established entitlement pattern; no new infrastructure.
- **Alternatives considered**: Separate Engage subscription entity — over-engineered for the prototype; the feature-key approach maps 1:1 to how Mailing/Tabulation/Reports are gated today.

## R8. NOBO positional data shape (FR-022/FR-023)

**Question**: Minimum NOBO data fields for the positional view?

- **Decision**: Add `holderCategory` to `Position` (`REGISTERED | PLAN | BENEFICIAL | NOBO`), replacing inference-only logic (`accountType === "DTC/CDS"`). The NOBO tab displays a positions table filtered to `holderCategory = NOBO` with: holder name, account number, shares, state. NOBO-specific reports/visualizations are explicitly out of scope for v1 (FR-023).
- **Rationale**: Reuses the Position model and existing table patterns (`VotingTabulationTable` / `useTabulationInsights`); also gives the heat map and tabulation charts a reliable population discriminator (needed for FR-001/FR-017/FR-018).
- **Alternatives considered**: Separate `nobo_positions` table/endpoint — rejected; identical shape to `Position`, would duplicate transforms and seeds.

## R9. Registered-only labeling (FR-001/FR-002)

**Decision**: `VotingActivityCard` title/subheader becomes "Voting Activity — Registered Holders", with a persistent caption "Reflects Registered Holder voting only"; data is filtered to `holderCategory = REGISTERED` (or legacy `accountType === "DTC/CDS"` until reseed). Tooltips inherit the filtered series so no full-population implication remains.

## R10. Shares Voted proposal selector (FR-003–FR-006)

**Decision**: `SharesVotedCard` gains an MUI `Select` listing proposals (`proposalNumber` + truncated `proposalTitle`) from `useVotingTabulation().proposals`, defaulting to the lowest `proposalNumber`. The pie renders the selected proposal's `totalVotesFor/Against/Abstain`. Single-proposal meetings render the selector disabled (still showing context). The chart header shows "Proposal {n}: {title}".

---

## Resolved-unknowns summary

| Spec marker | Resolution |
| --- | --- |
| Historical report regeneration | R1 — render-on-demand, automatic |
| Legacy report inventory | R2 — `MOCK_REPORTS` + tabulation PDF |
| ADR vs non-ADR broker fields | R3 — single generic structure |
| Reporting tab visualizations | R4 — wire orphaned charts |
| Heat map missing-location handling | R6 — "Unknown" bucket, count disclosed |
| Heat map granularity | R6 — US state + International |
| Engage-active determination | R7 — `enabledFeatures` / `ClientFeatureKey: "nobo"` |
| NOBO minimum fields | R8 — `holderCategory` on Position |

All `[NEEDS CLARIFICATION]` markers are resolved. **Phase 0 complete.**
