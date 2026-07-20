# Implementation Plan: Tabulation, Reporting & Data Visualization Enhancements

**Branch**: `002-tabulation-enhancements` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md) **Input**: Feature specification from `/specs/002-tabulation-enhancements/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✓
2. Fill Technical Context ✓ (no remaining NEEDS CLARIFICATION — see research.md)
3. Evaluate Constitution Check ✓ PASS
4. Execute Phase 0 → research.md ✓
5. Execute Phase 1 → contracts/, data-model.md, quickstart.md ✓
6. Re-evaluate Constitution Check ✓ PASS
7. Plan Phase 2 → task generation approach described below ✓
8. STOP — ready for /tasks command
```

## Summary

Five enhancement areas to the meeting analytics surfaces: (1) Tabulation — Registered-only labeling on Voting Activity, a proposal-driven Shares Voted chart with a selector, and removal of the Total Votes section; (2) Reporting — legacy report parity via a report dropdown, a new Broker Breakout Report, and a design refresh; (3) Reporting tab — wire existing orphaned chart components; (4) Visualization — replace Early/Late quorum segmentation with a milestone timeline and add a geographic heat map (MUI X Charts Pro Heatmap); (5) an Engage-gated NOBO tab. Backend impact is limited to three new `Position` fields (`holderCategory`, `state`, `country`) and a `"nobo"` client feature key, following the schema-first OpenAPI workflow; everything else consumes existing endpoints.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19, Next.js 15 (app dir, client-rendered) **Primary Dependencies**: MUI 7.3+, `@mui/x-charts` 8.12 (+ `@mui/x-charts-pro` for Heatmap), SWR, `@react-pdf/renderer`, @rolemodel/betanxt-design-system **Storage**: Supabase PostgreSQL (local), schema generated from `mock-api-server/openapi-schema/openapi.yaml` **Testing**: Playwright (e2e + integration), type-check via `tsc --noEmit` **Target Platform**: Web (last-2 evergreen browsers) **Project Type**: web — `issuer-portal/` frontend + `mock-api-server/` backend (existing monorepo structure) **Performance Goals**: Charts interactive at ≤5k positions per meeting (current fetch limit); no new endpoints, aggregation client-side **Constraints**: Schema-first workflow mandatory (OpenAPI → migrations → seeds → types → manual transforms); no `any` types; MUI `sx` styling; feature gating via existing `enabledFeatures` pattern **Scale/Scope**: ~6 modified components, ~5 new components, 1 new route/tab, 2 hooks, 3 schema fields, seed updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 2 (existing `issuer-portal`, `mock-api-server`) — no new projects ✓
- Using framework directly? Yes — MUI X chart components used directly, no wrappers ✓
- Single data model? Yes — `Position`/`Proposal` extended in place; view models are render-time aggregations, not DTOs ✓
- Avoiding patterns? Yes — no new repositories/abstractions; reuses `useVotingTabulation`/`useReports` hook pattern ✓

**Architecture**:

- Feature lives in existing app structure (components/hooks per workspace convention); the repo does not use a library-per-feature layout — consistent with constitution Principle II (component-driven) ✓
- No CLI surface applicable (web UI feature) — N/A

**Testing (NON-NEGOTIABLE)**:

- Contract expectations written first (`contracts/`) → Playwright integration specs asserting them must fail before implementation ✓ planned
- Order: contract (API shape) → integration (page-level) → e2e (quickstart scenarios) ✓
- Real dependencies: local Supabase with seeded data, no mocked fetch layers ✓

**Observability**:

- No `console.*` in production UI (workspace rule); errors surface via existing error boundaries and structured API errors ✓

**Versioning**:

- Internal monorepo feature — follows repo branch/PR flow (`002-tabulation-enhancements` from master, PR with Why/What) ✓

**Initial Constitution Check: PASS** · **Post-Design Constitution Check: PASS** (no new violations introduced by Phase 1 design)

## Project Structure

### Documentation (this feature)

```
specs/002-tabulation-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 ✓
├── data-model.md        # Phase 1 ✓
├── quickstart.md        # Phase 1 ✓
├── contracts/           # Phase 1 ✓
│   ├── position-schema-delta.yaml
│   ├── client-features-delta.yaml
│   └── ui-contracts.md
└── tasks.md             # Phase 2 (/tasks command — NOT created by /plan)
```

### Source Code (existing monorepo — web structure)

```
mock-api-server/
├── openapi-schema/openapi.yaml          # Position +3 fields, Client feature docs
├── domain-models/api/positions.ts       # MANUAL transform updates
├── domain-models/api/clients.ts         # MANUAL transform updates
└── supabase/seed.ts                     # holderCategory backfill, state/country, NOBO rows, "nobo" feature

issuer-portal/
├── app/[clientTicker]/meeting/[meetingId]/nobo/page.tsx   # NEW route
├── app/[clientTicker]/reporting/page.tsx                  # mount orphaned charts + timeline + heat map
├── components/Navigation/EventTabs.tsx                    # NOBO tab, featureGate "nobo"
├── components/Tabulation/VotingActivityCard.tsx           # Registered-only labeling/filter
├── components/Tabulation/SharesVotedCard.tsx              # proposal selector
├── components/Meeting/SharesVotedChart.tsx                # per-proposal rendering
├── components/Meeting/VotingTabulationTable.tsx           # remove Total Votes column
├── components/Reporting/DownloadReportsTable.tsx          # dropdown + enable legacy rows
├── components/Reporting/BrokerBreakoutReport.tsx          # NEW
├── components/Reporting/QuorumTimelineChart.tsx           # NEW (replaces Early/Late)
├── components/Reporting/GeoHeatmapCard.tsx                # NEW (MUI X Pro Heatmap)
├── components/Nobo/NoboPositionsTable.tsx                 # NEW
├── hooks/useQuorumTimeline.ts                             # NEW
├── hooks/useGeoDistribution.ts                            # NEW
├── hooks/useClients.ts                                    # ClientFeatureKey + "nobo"
└── tests/e2e/                                             # new specs per ui-contracts.md
```

**Structure Decision**: Option 2 (web) — existing frontend/backend workspaces; no structural changes.

## Phase 0: Outline & Research ✓

All 8 spec `[NEEDS CLARIFICATION]` markers resolved in [research.md](./research.md) (R1–R10). Key decisions:

- Reports are rendered on demand → modernization applies universally (R1); parity scope = `MOCK_REPORTS` + tabulation PDF (R2).
- Broker Breakout = single generic structure from existing `tabulation-report` endpoint (R3).
- Reporting tab v1 = wire the six orphaned chart components' high-value subset (R4).
- Quorum timeline computed client-side from `Position.dateVoted` (R5).
- Heat map = MUI X Charts Pro Heatmap, US-state granularity + International/Unknown buckets; requires `state`/`country` on Position (R6).
- Engage gating via existing `enabledFeatures` with new `"nobo"` key (R7); NOBO data via `holderCategory` on Position (R8).

## Phase 1: Design & Contracts ✓

- **Entities** → [data-model.md](./data-model.md): Position (+`holderCategory`, `state`, `country`), Client (`"nobo"` feature), four frontend view models. Migration/seed sequence documented.
- **Contracts** → [contracts/](./contracts/): two OpenAPI schema deltas + nine UI contracts (C1–C9) mapping every FR to a component and testable assertion.
- **Contract tests**: planned as failing-first Playwright integration specs (API shape: positions return `holderCategory`/`state`; UI: per ui-contracts.md) — generated by /tasks.
- **Test scenarios** → [quickstart.md](./quickstart.md): 13 validation steps mirroring the spec's 11 acceptance scenarios + regression checks.
- **Agent context**: repo guidance already captured in CLAUDE.md/AGENTS.md; no agent-file update required for this feature's tech (no new stack).

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do — NOT executed during /plan._

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base.
- Backend first (schema-first pipeline is a hard dependency for heat map/NOBO/labeling):
  1. OpenAPI deltas → migration → seeds → types → manual transforms (sequential chain)
  2. Contract test tasks for Position/Client response shapes [P]
- Frontend in three independent tracks (parallelizable after backend):
  - **Tabulation track**: C1 labeling → C2 proposal selector → C3 Total Votes removal (each: failing e2e spec, then implementation)
  - **Reporting track**: C4 dropdown + Broker Breakout → C5 design refresh → C6 orphaned charts
  - **Visualization track**: C7 quorum timeline (hook + chart + table cleanup) → C8 heat map (hook + Pro Heatmap card)
- **NOBO track** (depends on backend + EventTabs): C9 tab registration → route page → positions table → gating e2e.
- Final: quickstart walkthrough validation + lint/type-check/regression tasks.

**Ordering Strategy**: TDD (failing spec before each implementation task); dependency order: schema → data hooks → components → pages; [P] markers for the three frontend tracks (independent files).

**Estimated Output**: ~30 numbered tasks in tasks.md.

## Phase 3+: Future Implementation

**Phase 3**: /tasks generates tasks.md · **Phase 4**: implementation · **Phase 5**: quickstart validation, Playwright suite, performance check at 5k positions.

## Complexity Tracking

_No constitutional violations — table intentionally empty._

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command — approach described only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v1.0.0 — see `.specify/memory/constitution.md`_
