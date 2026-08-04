# Quickstart: Validating Tabulation, Reporting & Data Visualization Enhancements

End-to-end validation walkthrough. Each step maps to an acceptance scenario in `spec.md`.

## Setup

```bash
pnpm install
cd mock-api-server && pnpm run supabase:start && pnpm run full-reset
cd .. && pnpm dev
# Frontend: http://localhost:3000 · API: http://localhost:3001
```

Sign in as a CSM (`csm.user` / `CsmP@ss1`) or use bypass auth. Navigate to an Engage-enabled client (WEN) with a meeting in tabulation phase.

## 1. Tabulation view (`/{ticker}/meeting/{meetingId}/tabulation`)

1. **Voting Activity** — title reads "Voting Activity — Registered Holders" with the caption "Registered Holder votes". (Scenario 1)
2. **Shares Voted** — Proposal 1 shown by default; selector lists all proposals; choosing Proposal 2 updates the FOR/AGAINST/ABSTAIN pie and header. (Scenarios 2–3)
3. **Total Votes** — confirm no "Total Votes" column/section anywhere on the page. (Scenario 4)

## 2. Reporting

4. Open the meeting **Reports** tab → report dropdown lists legacy reports + "Broker Breakout Report"; download each (none disabled). (Scenario 5)
5. Generate the Broker Breakout Report → broker name / positions / shares / % voted columns; modern styling matching portal branding. (Scenarios 5–6)
6. Open the client **Reporting** tab (`/{ticker}/reporting`) → Broker Voting, Participation, Positions Voted, and Voting Performance charts render with data.

## 3. Quorum timeline

7. On the client Reporting tab, the quorum visualization is a **timeline** (mail date → deadline) with milestone markers; no Early/Late columns. (Scenario 7)
8. For a meeting with a follow-up mailing, verify an intermediate marker appears and accumulated votes visibly step up around it.

## 4. Geographic heat map

9. Open the Geo Heat Map → toggle "Shareholders" vs "Shares Held"; both render. (Scenario 8)
10. Default populations = Registered + Plan; enable NOBO (WEN is Engage-enabled) and confirm values change. (Scenario 9)
11. Confirm "Unknown" row shows a disclosed count when seeded positions lack `state`.

## 5. NOBO tab

12. On WEN (Engage-enabled): the **NOBO** tab is visible and lists NOBO positional data. (Scenario 10)
13. Switch to a non-Engage client: NOBO tab absent. (Scenario 11)

## Regression checks

```bash
cd issuer-portal
pnpm run lint && pnpm exec tsc --noEmit
pnpm run test          # Playwright suites incl. new e2e specs
```

- Phase 6/7 dashboards still render `VotingTabulationTable` correctly after the Total Votes column removal.
- Existing tabulation PDF export unchanged except styling refresh.
