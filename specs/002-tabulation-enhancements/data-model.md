# Data Model: Tabulation, Reporting & Data Visualization Enhancements

**Branch**: `002-tabulation-enhancements` | **Date**: 2026-06-11
**Prerequisite**: `research.md` (decisions R1–R10)

Schema changes follow the repo's schema-first workflow: OpenAPI spec → generated migrations → seeds → generated types → **manual** domain-model transform updates.

---

## Modified Entities

### Position (`mock-api-server/openapi-schema/openapi.yaml`)

| Field                                                          | Type                                                          | New?     | Notes                                                                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `holderCategory`                                               | string enum: `REGISTERED` \| `PLAN` \| `BENEFICIAL` \| `NOBO` | **NEW**  | Replaces inference via `accountType === "DTC/CDS"` (R8). Backfilled in seeds: `DTC/CDS` → `REGISTERED`, `Non-DTC` → `BENEFICIAL`; new seeded `PLAN`/`NOBO` rows. |
| `state`                                                        | string (nullable)                                             | **NEW**  | US state code (e.g. `NC`) or null. Drives heat map (R6).                                                                                                         |
| `country`                                                      | string (nullable)                                             | **NEW**  | ISO country code; `US` default in seeds. Non-US → "International" bucket.                                                                                        |
| `dateVoted`                                                    | string                                                        | existing | Source of quorum-timeline accumulation (R5).                                                                                                                     |
| `voteStatus`, `shares`, `sharesVoted`, `source`, `accountType` | —                                                             | existing | Unchanged.                                                                                                                                                       |

**Validation**: `holderCategory` required on new rows; `state` nullable (missing → "Unknown" bucket, FR-019); `country` nullable.

**Manual transform**: `mock-api-server/domain-models/api/positions.ts` — add `holder_category` → `holderCategory`, `state`, `country` (snake→camel). _Skipping this causes silent data loss (CLAUDE.md pitfall)._

### Client (`enabledFeatures`)

| Change                                    | Where                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Add `"nobo"` to allowed feature keys      | `Client.enabledFeatures` in OpenAPI; `ClientFeatureKey` union in `issuer-portal/hooks/useClients.ts` |
| Seed Engage-enabled clients with `"nobo"` | `supabase/seed.ts` (e.g. WEN, FOC)                                                                   |

### Proposal — no schema change

`totalVotesFor` / `totalVotesAgainst` / `totalVotesAbstain` / `proposalNumber` / `proposalTitle` already support the per-proposal Shares Voted chart (R10).

---

## New View Models (frontend only, no persistence)

### QuorumTimelinePoint (`issuer-portal/hooks/useQuorumTimeline.ts`)

| Field                   | Type   | Description                                           |
| ----------------------- | ------ | ----------------------------------------------------- |
| `date`                  | Date   | Calendar day bucket                                   |
| `cumulativeSharesVoted` | number | Running total of `sharesVoted` ordered by `dateVoted` |
| `percentOfOutstanding`  | number | `cumulativeSharesVoted / totalSharesOutstanding`      |

### MailingMilestone

| Field   | Type                                 | Description                                                   |
| ------- | ------------------------------------ | ------------------------------------------------------------- |
| `label` | string                               | "Mail Date", "Follow-Up Mailing n", "Meeting / Vote Deadline" |
| `date`  | Date                                 | From `Meeting` + additional-mailing data                      |
| `kind`  | `"mail" \| "followUp" \| "deadline"` | Marker styling                                                |

### GeoHeatmapCell (`issuer-portal/hooks/useGeoDistribution.ts`)

| Field              | Type               | Description                                      |
| ------------------ | ------------------ | ------------------------------------------------ |
| `location`         | string             | US state code, `"International"`, or `"Unknown"` |
| `shareholderCount` | number             | Distinct positions at location                   |
| `sharesHeld`       | number             | Sum of `shares` at location                      |
| `populations`      | `HolderCategory[]` | Which populations are included (filter state)    |

### Report registry entry (`issuer-portal/components/Reporting/`)

| Field      | Type                 | Description              |
| ---------- | -------------------- | ------------------------ |
| `id`       | string               | e.g. `"broker-breakout"` |
| `label`    | string               | Dropdown display name    |
| `formats`  | `("pdf" \| "xls")[]` | Available outputs        |
| `generate` | function ref         | Render-on-demand (R1)    |

---

## Entity Relationships

```
Client 1──* Meeting 1──* Proposal
                   1──* Position (holderCategory, state, country, dateVoted)
                   1──* PositionVote (per-proposal FOR/AGAINST/ABSTAIN)
Client.enabledFeatures ("nobo") ──gates──> NOBO tab + NOBO heat-map population
Position.dateVoted ──aggregates──> QuorumTimelinePoint
Position.state/country ──aggregates──> GeoHeatmapCell
Proposal.totalVotes* ──renders──> SharesVotedChart (selected proposal)
```

---

## State Transitions

None introduced. `holderCategory` is immutable per position; feature gating is configuration, not workflow state.

---

## Migration / Seed Impact

1. `openapi.yaml`: Position +3 fields, Client feature-key docs.
2. `pnpm run generate:postgres-schema` → migration adds `holder_category`, `state`, `country` columns.
3. `supabase/seed.ts`: backfill `holder_category`; assign realistic `state` distribution (skew NC/NY/CA/TX); seed PLAN + NOBO rows for Engage-enabled clients; add `"nobo"` to their `enabled_features`.
4. `pnpm run generate:db-types` && `generate:api-types`.
5. Manual: `mock-api-server/domain-models/api/positions.ts`, `clients.ts` transforms.
