/**
 * What to build for the CSM tabulation release.
 *
 * @remarks
 * Written as finished behaviour, mirroring the UI-enhancements and
 * mailing-thumbnail specs: a developer should be able to build from this
 * without knowing which parts already exist. Where a file is named, it is named
 * so they can find the thing.
 *
 * Content lives in a typed module because it is the deliverable — the page
 * renders it and the download serialises it, so the two cannot drift. The
 * shared shapes (Requirement, SpecSection, …) are reused from the
 * UI-enhancements spec so every package renders through the same page
 * component.
 */

import type {
  SpecMeta,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

/* -------------------------------------------------------------------------- */
/* 1. Releasing Tabulation                                                    */
/* -------------------------------------------------------------------------- */

const releasingTabulation: SpecSection = {
  id: "releasing-tabulation",
  title: "1. Releasing Tabulation",
  summary:
    "Requirements for the CSM action that makes a meeting's tabulation results visible. Visibility is controlled purely by that action — never by a date, a phase, or a vote-cutoff calculation.",
  background: [
    "Tabulation results are withheld from every surface until a CSM releases them. Nothing about the release is automatic: no date arrives and turns results on, no phase advance turns them on, no cutoff calculation turns them on. A CSM does it, or it does not happen.",
    "The switch is one boolean on the meeting — `tabulationReleased`, default false — set through `PUT /meetings/{meetingId}`. It has two states and no third: Not Released and Released.",
    "CSMs work from the events list at `/events`, a view only they see. Each row carries its meeting's tabulation state as a selectable chip: open the chip's dropdown, pick the other state, done. Because a CSM's afternoon is usually 'release these fourteen meetings', the grid also takes checkbox selection and a batch **Release tabulation** action over everything ticked.",
    "Releasing is total. One flag governs every surface at once, so there is no partial release in which the dashboard shows figures the tabulation page does not.",
  ],
  topics: [
    {
      question: "What decides whether a client can see tabulation.",
      answer: [
        "A CSM's action, and only that. The meeting carries a `tabulationReleased` boolean that defaults to false; nothing but an explicit release sets it true.",
        "There is no date rule anywhere in the gate. Dates appear in the withheld copy as an expectation, not as a condition the code evaluates.",
      ],
      requirementIds: ["TAB-01", "TAB-02"],
    },
    {
      question: "Who releases tabulation, and from where.",
      answer: [
        "A CSM, from the events list at `/events`. That list is a CSM-only view; other user types never reach it and never see the control.",
        "Each row's tabulation state is a chip with a dropdown, so the state is both the display and the control.",
      ],
      requirementIds: ["TAB-03", "TAB-04"],
    },
    {
      question: "How a CSM releases many meetings at once.",
      answer: [
        "The grid supports checkbox multi-select. With rows ticked, a batch **Release tabulation** action applies the release to every selected meeting.",
      ],
      requirementIds: ["TAB-05"],
    },
  ],
  requirements: [
    {
      id: "TAB-01",
      screens: [
        {
          href: "/events",
          label: "Events — CSM list",
        },
      ],
      title: "The meeting carries a tabulation release flag",
      statement:
        "`Meeting` carries a `tabulationReleased: boolean` that defaults to false and is settable through `PUT /meetings/{meetingId}`. Every surface that shows tabulation reads this one field.",
      rationale:
        "One field on the meeting means the release is total and unambiguous — there is no combination of flags that could leave two surfaces disagreeing about whether results are visible.",
      evidence: [
        "mock-api-server/openapi-schema/openapi.yaml",
        "mock-api-server/domain-models/api/meetings.ts",
        "types/api-exports.ts",
      ],
      acceptance: [
        "Given a newly created meeting, when it is read back, then `tabulationReleased` is false.",
        "Given `PUT /meetings/{meetingId}` with `tabulationReleased: true`, when it succeeds, then the meeting reads back as released and the value survives a page reload.",
        "Given the OpenAPI spec is regenerated, when the domain transform runs, then `tabulationReleased` round-trips between the snake_case column and the camelCase field rather than being silently dropped.",
      ],
    },
    {
      id: "TAB-02",
      screens: [
        {
          href: "/events",
          label: "Events — a status chip",
        },
      ],
      title: "Two states, and no date decides between them",
      statement:
        "Tabulation has exactly two states — Not Released and Released. No date, phase, cutoff, or elapsed-time calculation moves a meeting between them; only a write to `tabulationReleased` does.",
      rationale:
        "An automatic date rule was considered and rejected: results have to be checked before a client sees them, and a calendar cannot do the checking. Keeping dates out of the gate entirely means no one has to reason about which rule won.",
      evidence: ["hooks/useTabulationInsights.ts"],
      acceptance: [
        "Given a meeting whose meeting date has passed and which has never been released, when a client opens tabulation, then results are still withheld.",
        "Given a meeting released well before its meeting date, when a client opens tabulation, then results are visible.",
        "Given the gating code, when it is read, then it references no date field.",
      ],
    },
    {
      id: "TAB-03",
      screens: [
        {
          href: "/events",
          label: "Events — CSM list",
        },
      ],
      title: "The events list is a CSM-only view",
      statement:
        "The events list at `/events` is visible only to users of type `CSM`. The tabulation status column, its dropdown, and the batch action exist only in that view.",
      rationale:
        "Releasing is an internal control, so the control never appears on a client-facing surface at all — not disabled, not hidden behind a tooltip, simply not rendered.",
      evidence: [
        "app/events/page.tsx",
        "components/Events/EventsDataGrid.tsx",
        "auth.ts",
      ],
      acceptance: [
        "Given a CSM, when they open `/events`, then the tabulation status column and the batch action are present.",
        "Given a non-CSM user, when they reach `/events`, then no tabulation status column, dropdown, or batch action renders.",
        "Given a CSM, when the list loads, then it shows the meetings in their assigned portfolio.",
      ],
    },
    {
      id: "TAB-04",
      screens: [
        {
          href: "/events",
          label: "Events — a status chip",
        },
      ],
      title: "Each row's status chip is selectable",
      statement:
        "Each event row shows its tabulation state as a chip — Not Released or Released — that opens a dropdown listing both states. Choosing the other state writes `tabulationReleased` for that meeting and the chip settles on the new state.",
      rationale:
        "The state and the control are the same element, so a CSM scanning the column for what is still withheld can act on the row they are already looking at.",
      evidence: [
        "components/Events/EventDataGridCells.tsx",
        "components/Events/eventsDataGridColumns.tsx",
      ],
      acceptance: [
        "Given a row for a withheld meeting, when it renders, then its chip reads Not Released.",
        "Given a status chip, when a user opens it, then a dropdown offers both Not Released and Released.",
        "Given a chip showing Not Released, when a user picks Released, then the meeting is updated and the chip reads Released without a page reload.",
        "Given the update fails, when the response returns, then the chip reverts to its previous state and the failure is surfaced rather than swallowed.",
        "Given a keyboard user, when they tab to the chip, then it is focusable and its dropdown opens and closes from the keyboard.",
      ],
    },
    {
      id: "TAB-05",
      screens: [
        {
          href: "/events",
          label: "Events — batch release",
        },
      ],
      title: "The grid batch-releases selected meetings",
      statement:
        "The events grid supports checkbox multi-select, and a **Release tabulation** button applies the release to every selected meeting in one go. The button exists only while at least one row is selected, and it is a contained button at the default size, positioned over the grid's header band rather than laid out in it.",
      rationale:
        "A CSM releases a whole day's meetings at once; doing that one dropdown at a time is the difference between a minute and twenty. Releasing is the primary action on the screen, so it is a contained button — but it is only actionable once rows are checked, so holding a row of the grid open for it pushes the data down to show a control that does nothing.",
      evidence: [
        "components/Events/EventsDataGrid.tsx",
        "components/Events/EventsGridToolbar.tsx",
        "components/Events/useTabulationRelease.ts",
      ],
      acceptance: [
        "Given the events grid, when it renders for a CSM, then each row carries a selection checkbox and a header checkbox selects the visible rows.",
        "Given no rows selected, when the toolbar renders, then the Release tabulation button is not rendered at all and the grid's header band is unchanged.",
        "Given several rows selected, when a CSM triggers Release tabulation, then every selected meeting is released and each row's chip updates to Released.",
        "Given a batch in flight, when it is running, then the button reports its progress and cannot be triggered again.",
        "Given a mixed selection of released and withheld meetings, when the action runs, then already-released meetings are left as they are rather than erroring.",
        "Given a batch where some writes fail, when it settles, then the meetings that persisted stay released and the count that succeeded is announced.",
        "Given the action completes, when it finishes, then the selection is cleared, so the button disappears with it and the same rows cannot be released twice.",
      ],
    },
  ],
  tables: [
    {
      title: "The two states",
      caption:
        "There is no third state, and nothing other than a CSM write moves a meeting between these two.",
      headers: [
        "State",
        "`tabulationReleased`",
        "Set by",
        "What a client sees",
      ],
      rows: [
        [
          "Not Released",
          "false (the default)",
          "The meeting's initial value, or a CSM switching back",
          "Empty states and placeholders — no figures at all",
        ],
        [
          "Released",
          "true",
          "A CSM, from the row chip or the batch action",
          "Every tabulation surface, in full",
        ],
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* 2. What the Client Sees While Tabulation Is Withheld                       */
/* -------------------------------------------------------------------------- */

const withheldSurfaces: SpecSection = {
  id: "withheld-tabulation-surfaces",
  title: "2. What the Client Sees While Tabulation Is Withheld",
  summary:
    "How each tabulation surface behaves before release, and the gating that makes withheld mean not fetched rather than fetched and hidden.",
  background: [
    "Withheld means not fetched. The gate lives in `hooks/useTabulationInsights.ts`: when the meeting is not released the hook returns its empty result and never issues the positions, proposals, meeting, and tabulation-report requests. Nothing is loaded and then hidden, so there is no withheld figure sitting in a network response, a cache, or a React tree for a determined reader to dig out.",
    "Components read the state through `useTabulationRelease()`, a context that mirrors the existing `TabulationDisplayContext` exactly: a provider mounted once in the meeting layout, a hook that throws when used outside it, one memoised value.",
    "Each surface has one agreed appearance while withheld — an empty state, a placeholder, or nothing rendered — listed in the table below. Everything around it is untouched: tabs, headings, dates, statuses, document counts, and prior-year figures all stay exactly where they are.",
    "Prior-year figures are deliberately exempt. Last year's result is a published, historical fact; withholding it would remove context the client already has without protecting anything.",
  ],
  topics: [
    {
      question:
        "Whether withheld data is fetched and hidden, or never fetched at all.",
      answer: [
        "Never fetched. `useTabulationInsights` checks the release before it builds its API client and returns the empty result if the meeting is withheld.",
        "The state reaches components through `useTabulationRelease()`, built to the same shape as the existing display-mode context.",
      ],
      requirementIds: ["TAB-06", "TAB-07"],
    },
    {
      question: "What the tabulation page shows before release.",
      answer: [
        "One empty state and nothing else — no gauge, no vote matrix, no proposal details, no positions table. Its copy reads: Tabulation will be available 15 days before the meeting.",
        "That sentence sets an expectation. It is not a rule, and no code compares a date against it.",
      ],
      requirementIds: ["TAB-08"],
    },
    {
      question: "What the meeting dashboard shows before release.",
      answer: [
        "Shares Voted and Shares Not Voted read `---`. Their prior-year figures stay visible, and the rest of the dashboard is unchanged.",
        "The tabulation tracker's progress bar is not rendered at all, because a bar at zero reads as a real measurement.",
      ],
      requirementIds: ["TAB-09", "TAB-10"],
    },
    {
      question: "What the quorum card shows before release.",
      answer: [
        "An empty state in place of the gauge, on both the dashboard and the tabulation page.",
      ],
      requirementIds: ["TAB-11"],
    },
    {
      question: "What changes at the moment of release.",
      answer: [
        "Every surface at once. There is no ordering, no partial reveal, and no surface that lags behind — the next load of any tabulation surface shows the full thing.",
      ],
      requirementIds: ["TAB-12"],
    },
  ],
  requirements: [
    {
      id: "TAB-06",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — withheld",
        },
      ],
      title: "Withheld data is never fetched",
      statement:
        "`useTabulationInsights` gates on the release: for a withheld meeting it returns its empty result — no positions, no proposals, no summary, no quorum model — without issuing any of its four requests.",
      rationale:
        "Fetching and hiding leaves the figures in the network tab and the component tree. Not fetching is the only version of withheld that actually withholds, and it saves four requests per page load on meetings nobody can read yet.",
      evidence: [
        "hooks/useTabulationInsights.ts",
        "contexts/TabulationReleaseContext.tsx",
      ],
      acceptance: [
        "Given a withheld meeting, when a tabulation surface mounts, then no request is made to `/positions`, `/meetings/{id}/proposals`, or `/meetings/{id}/tabulation-report`.",
        "Given a withheld meeting, when the hook returns, then `loading` is false and every collection it returns is empty.",
        "Given a released meeting, when a tabulation surface mounts, then the hook fetches and returns exactly as it does today.",
        "Given a meeting released while a client has the page open, when they next load a tabulation surface, then the data is fetched.",
      ],
    },
    {
      id: "TAB-07",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — any state",
        },
      ],
      title: "A release context mirrors the display context",
      statement:
        "`TabulationReleaseProvider` is mounted in the meeting layout alongside `TabulationDisplayProvider`, and `useTabulationRelease()` returns the current meeting's release state. The hook throws a named error when used outside the provider.",
      rationale:
        "The display-mode context already solves 'one meeting-wide value every tabulation component needs'. Copying its shape means no new pattern to learn and one obvious place to mount the new provider.",
      evidence: [
        "contexts/TabulationDisplayContext.tsx",
        "app/[clientTicker]/meeting/layout.tsx",
      ],
      acceptance: [
        "Given a component inside the meeting layout, when it calls `useTabulationRelease()`, then it receives the current meeting's release state.",
        "Given a component outside the provider, when it calls the hook, then it throws `useTabulationRelease must be used within a TabulationReleaseProvider`.",
        "Given the provider re-renders without the release changing, when consumers read the value, then its identity is stable.",
        "Given the past-meeting layout, when a tabulation surface renders under it, then the provider is mounted there too.",
      ],
    },
    {
      id: "TAB-08",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — withheld",
        },
      ],
      title: "The tabulation page is an empty state before release",
      statement:
        "For a withheld meeting the tabulation page renders one empty state and nothing else, reading: Tabulation will be available 15 days before the meeting. No chart, card, table, or export control appears.",
      rationale:
        "The 15 days is descriptive copy that tells a client roughly when to come back. It is not a rule, and no code compares a date against it — a meeting released earlier or later than that shows results the moment it is released.",
      evidence: [
        "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx",
        "components/EmptyState.tsx",
      ],
      acceptance: [
        "Given a withheld meeting, when a client opens the tabulation page, then the only content is the empty state with that copy.",
        "Given a withheld meeting, when the page renders, then the quorum gauge, vote matrix, tabulation report, and proposal details cards are absent from the DOM.",
        "Given a withheld meeting 40 days from its meeting date, when the page renders, then the copy is unchanged — the sentence never recalculates.",
        "Given a released meeting, when a client opens the page, then the full layout renders and the empty state is gone.",
      ],
    },
    {
      id: "TAB-09",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting dashboard — withheld",
        },
      ],
      title: "Dashboard share figures read as placeholders",
      statement:
        "For a withheld meeting the dashboard's Shares Voted and Shares Not Voted cards show `---` in place of their current and alternate values. Their prior-year figures remain visible.",
      rationale:
        "Last year's result is published history — hiding it removes context the client already has and protects nothing. This year's is the only figure being withheld.",
      evidence: [
        "components/Meeting/TabulationTracker.tsx",
        "components/Meeting/tabulation-tracker/HistoricalShareCard.tsx",
      ],
      acceptance: [
        "Given a withheld meeting, when the dashboard renders, then Shares Voted and Shares Not Voted both read `---`.",
        "Given a withheld meeting with a comparable prior year, when the cards render, then the prior-year figures are shown as normal.",
        "Given a withheld meeting, when a user switches the Percentage/Count display, then the placeholders are unaffected.",
        "Given a released meeting, when the dashboard renders, then both cards show their figures.",
      ],
    },
    {
      id: "TAB-10",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting dashboard — withheld",
        },
      ],
      title: "The tracker's progress bar is not rendered",
      statement:
        "For a withheld meeting the tabulation tracker does not render its vote progress bar. The surrounding tracker cards keep their positions.",
      rationale:
        "An empty or zeroed bar reads as a measurement — 'nobody has voted' — rather than as an absence. Removing it says nothing instead of saying something false.",
      evidence: [
        "components/Meeting/tabulation-tracker/VoteProgressBar.tsx",
        "components/Meeting/TabulationTracker.tsx",
      ],
      acceptance: [
        "Given a withheld meeting, when the tracker renders, then no progress bar and no percentage-voted tooltip are present in the DOM.",
        "Given a withheld meeting, when the tracker renders, then the remaining cards do not shift into the vacated space in a way that breaks the layout.",
        "Given a released meeting, when the tracker renders, then the progress bar appears as it does today.",
      ],
    },
    {
      id: "TAB-11",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — quorum card",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting dashboard — quorum card",
        },
      ],
      title: "The quorum card shows an empty state",
      statement:
        "For a withheld meeting the percentage-to-quorum card renders an empty state in place of the gauge, wherever the card appears. Its quorum-met chip and represented/required figures do not render.",
      rationale:
        "The gauge is a single glanceable answer to 'are we at quorum', so leaving any part of it — even the chip — would answer the question the release is meant to hold back.",
      evidence: [
        "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
        "components/EmptyState.tsx",
      ],
      acceptance: [
        "Given a withheld meeting, when the quorum card renders, then an empty state appears where the gauge would be.",
        "Given a withheld meeting, when the card renders, then no quorum-met chip, represented-shares figure, or required-shares figure is present.",
        "Given a withheld meeting, when the card renders on both the dashboard and the tabulation page, then it behaves identically in both.",
        "Given a released meeting, when the card renders, then the gauge and its figures return.",
      ],
    },
    {
      id: "TAB-12",
      screens: [
        {
          href: "/WEN/meeting/wen-special-meeting-2026/tabulation",
          label: "Tabulation — released",
        },
        {
          href: "/WEN/meeting/wen-special-meeting-2026/dashboard",
          label: "Meeting dashboard — released",
        },
      ],
      title: "Release restores every surface at once",
      statement:
        "Releasing a meeting restores all four surfaces together — tabulation page, dashboard share figures, tracker progress bar, and quorum card — with no partial state in which one shows figures and another does not.",
      rationale:
        "A client comparing a dashboard figure against a tabulation page that disagrees will report it as a bug, and be right to. One flag over all surfaces makes that state unreachable.",
      evidence: [
        "hooks/useTabulationInsights.ts",
        "contexts/TabulationReleaseContext.tsx",
      ],
      acceptance: [
        "Given a released meeting, when a client visits each tabulation surface, then every one shows its figures.",
        "Given a meeting switched back to Not Released, when a client next loads any tabulation surface, then all of them withhold again.",
        "Given the release changes, when a surface re-reads it, then no surface caches the previous state past its next load.",
      ],
    },
  ],
  tables: [
    {
      title: "What each surface shows",
      caption:
        "The Not Released column is the whole of what renders — nothing else from that surface appears.",
      headers: ["Surface", "Not Released", "Released"],
      rows: [
        [
          "Tabulation page",
          "One empty state: Tabulation will be available 15 days before the meeting.",
          "Quorum gauge, vote matrix, tabulation report, proposal details",
        ],
        [
          "Dashboard — Shares Voted / Shares Not Voted",
          "`---` for the current figures; prior-year figures still shown",
          "Current and prior-year figures",
        ],
        [
          "Tabulation tracker — progress bar",
          "Not rendered",
          "Voted / not-voted progress bar",
        ],
        [
          "Percentage-to-quorum card",
          "Empty state in place of the gauge",
          "Gauge, quorum chip, represented and required shares",
        ],
        ["Everything else on those pages", "Unchanged", "Unchanged"],
      ],
    },
    {
      title: "Components and files",
      headers: ["File", "Role"],
      rows: [
        [
          "contexts/TabulationReleaseContext.tsx",
          "Provider and `useTabulationRelease()`, mirroring the display context",
        ],
        [
          "hooks/useTabulationInsights.ts",
          "The gate — returns the empty result without fetching when withheld",
        ],
        [
          "app/[clientTicker]/meeting/layout.tsx",
          "Mounts the release provider beside the display provider",
        ],
        ["app/events/page.tsx", "The CSM-only events list"],
        [
          "components/Events/EventDataGridCells.tsx",
          "The selectable tabulation status chip",
        ],
        [
          "components/Events/EventsDataGrid.tsx",
          "Checkbox multi-select and the batch release action",
        ],
        [
          "app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx",
          "Empty state in place of the whole page when withheld",
        ],
        [
          "components/Charts/QuorumGauge/QuorumGaugeCard.tsx",
          "Empty state in place of the gauge",
        ],
        [
          "components/Meeting/TabulationTracker.tsx",
          "Placeholder share figures; drops the progress bar",
        ],
        [
          "components/EmptyState.tsx",
          "The shared empty state used by all of the above",
        ],
      ],
    },
  ],
};

export const SPEC_SECTIONS: readonly SpecSection[] = [
  releasingTabulation,
  withheldSurfaces,
];

export const SPEC_META: SpecMeta = {
  audience: "Engineering",
  author: "Issuer Portal UX",
  repository: "betanxt-issuer-portal / issuer-portal",
  status: "For build",
  title: "Issuer Portal — CSM Tabulation Release",
  version: "1.0",
};
