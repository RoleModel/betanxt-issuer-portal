# Quorum Timeline Chart

Portable React component for displaying cumulative quorum progress and switching between events. It has no dependency on a specific API response, database schema, meeting model, or position model.

## Files

- `QuorumTimelineChart.tsx` — MUI chart, empty/loading states, and event selector
- `useQuorumTimeline.ts` — colocated data-shaping hook and portable input types

All project-local imports are relative and stay inside this directory.

## Dependencies

Install these packages in the receiving React application:

```sh
pnpm add @mui/material @mui/x-charts react
```

## Data contract

The package accepts a small presentation model. Map the receiving application's own data into:

- `events`: `{ id, label }[]`
- `votes`: `{ date, shares }[]`
- `milestones`: `{ date, kind, label }[]`
- `startDate`, `endDate`, and `totalOutstandingShares`

Source field names and nesting do not matter. The parent owns the selected event and performs the mapping:

```tsx
const selectedEvent = apiEvents.find(
  (event) => event.uuid === selectedEventId
)

const votes = apiVoteRecords
  .filter((record) => record.eventUuid === selectedEventId)
  .map((record) => ({
    date: record.recordedAt,
    shares: Number(record.amount),
  }))

const { points, milestones } = useQuorumTimeline({
  startDate: selectedEvent?.solicitationOpensAt,
  endDate: selectedEvent?.votingClosesAt,
  totalOutstandingShares: Number(selectedEvent?.eligibleShares ?? 0),
  votes,
  milestones: externalMilestones.map((milestone) => ({
    date: milestone.occurredAt,
    kind: mapMilestoneKind(milestone.category),
    label: milestone.displayName,
  })),
})

<QuorumTimelineChart
  events={apiEvents.map((event) => ({
    id: event.uuid,
    label: event.displayName,
  }))}
  selectedEventId={selectedEventId}
  onEventChange={setSelectedEventId}
  points={points}
  milestones={milestones}
  quorumRequirementPercent={quorumRequirement}
/>
```

The component never receives or inspects the source event or vote records.
