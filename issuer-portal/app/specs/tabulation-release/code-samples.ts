/**
 * Reference code attached to the tabulation-release requirements.
 *
 * @remarks
 * Stored as strings so the page can show and download them without the build
 * compiling them. These are proposals, not code that ships — they exist because
 * "withheld means not fetched" and "a chip that is also the control" are quick
 * to write and slow to interpret.
 */

import type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";

const RELEASE_FIELD = `# mock-api-server/openapi-schema/openapi.yaml — the Meeting field (abridged).
# One boolean, defaulting to false. Nothing else gates tabulation.

components:
  schemas:
    Meeting:
      properties:
        # …existing properties…
        tabulationReleased:
          type: boolean
          default: false
          description: >-
            Whether a CSM has released this meeting's tabulation results to the
            client. False until released. No date or phase changes this value.

    UpdateMeetingRequest:
      properties:
        # …existing properties…
        tabulationReleased:
          type: boolean

# PUT /meetings/{meetingId} already accepts UpdateMeetingRequest, so the release
# needs no new endpoint. Remember step 6 of the schema-driven flow: the field
# must be added by hand to the snake_case -> camelCase transform in
# mock-api-server/domain-models/api/meetings.ts, or it is silently dropped.
`;

const RELEASE_CONTEXT = `// contexts/TabulationReleaseContext.tsx — mirrors TabulationDisplayContext.
// Same shape as the display context: a private context, an exported provider,
// an exported hook that throws outside it, one memoised value.

interface TabulationReleaseContextValue {
  readonly released: boolean;
  /** Optimistic local set, used by the CSM controls. */
  readonly setReleased: (released: boolean) => void;
}

const TabulationReleaseContext =
  createContext<TabulationReleaseContextValue | null>(null);

export const TabulationReleaseProvider = ({
  children,
  initialReleased,
}: {
  readonly children: ReactNode;
  readonly initialReleased: boolean;
}) => {
  const [released, setReleased] = useState<boolean>(initialReleased);

  // React Compiler is deliberately not enabled (see issuer-portal/next.config.ts),
  // so this memo is load-bearing for context consumer stability.
  const value = useMemo<TabulationReleaseContextValue>(
    () => ({ released, setReleased }),
    [released]
  );

  return (
    <TabulationReleaseContext.Provider value={value}>
      {children}
    </TabulationReleaseContext.Provider>
  );
};

export const useTabulationRelease = (): TabulationReleaseContextValue => {
  const context = useContext(TabulationReleaseContext);

  if (context === null) {
    throw new Error(
      "useTabulationRelease must be used within a TabulationReleaseProvider"
    );
  }

  return context;
};

// app/[clientTicker]/meeting/layout.tsx — mounted beside the display provider.
<MeetingProvider>
  <DocumentProvider>
    <TabulationDisplayProvider>
      <TabulationReleaseProvider
        initialReleased={currentMeeting?.tabulationReleased ?? false}
      >
        <EventTabs />
        {children}
      </TabulationReleaseProvider>
    </TabulationDisplayProvider>
  </DocumentProvider>
</MeetingProvider>
`;

const INSIGHTS_GATE = `// hooks/useTabulationInsights.ts — the gate (abridged).
// The existing effect already bails when there is no meetingId; the release is
// the same kind of guard, placed before the client is built so none of the four
// requests is issued for a withheld meeting.

export function useTabulationInsights(
  meetingId?: string,
  meeting?: components["schemas"]["Meeting"] | null
): TabulationInsightsResult {
  const { released } = useTabulationRelease();

  // …existing state…

  useEffect(() => {
    if (!meetingId || !released) {
      // Withheld: nothing to load, and nothing to wait for.
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchTabulationData = async () => {
      setLoading(true);
      const apiClient = await buildApiClient();

      const [
        positionsResult,
        proposalsResult,
        meetingResult,
        tabulationReportResult,
      ] = await Promise.all([
        apiClient.GET("/positions", { params: { query: { meetingId, limit: 5000 } } }),
        apiClient.GET("/meetings/{meetingId}/proposals", { params: { path: { meetingId } } }),
        apiClient.GET("/meetings/{meetingId}", { params: { path: { meetingId } } }),
        apiClient.GET("/meetings/{meetingId}/tabulation-report", { params: { path: { meetingId } } }),
      ]);

      // …existing normalisation…
    };

    void fetchTabulationData();

    return () => {
      isCancelled = true;
    };
  }, [meetingId, released]);

  // With nothing fetched, every derived value is already the empty case:
  // positions [], proposals [], summary null, quorumGauge null.
}
`;

const STATUS_CHIP = `// components/Events/EventDataGridCells.tsx — the selectable status chip.
// The chip is both the display and the control: it reads the state and opens a
// dropdown offering the other one. Optimistic, reverting on failure.

const RELEASED_LABEL = "Released";
const NOT_RELEASED_LABEL = "Not Released";

export const TabulationStatusCell = ({ event }: { readonly event: EventRow }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [released, setReleased] = useState<boolean>(event.tabulationReleased);

  const handleSelect = (next: boolean): void => {
    setAnchorEl(null);

    if (next === released) {
      return;
    }

    setReleased(next);
    void releaseTabulation([event.id], next).catch(() => {
      setReleased(!next); // The write failed; put the chip back.
    });
  };

  return (
    <>
      <Chip
        aria-haspopup="listbox"
        clickable
        color={released ? "success" : "default"}
        deleteIcon={<ArrowDropDownIcon />}
        label={released ? RELEASED_LABEL : NOT_RELEASED_LABEL}
        onClick={(event_) => { setAnchorEl(event_.currentTarget); }}
        onDelete={(event_) => { setAnchorEl(event_.currentTarget); }}
        size="small"
        variant="outlined"
      />
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => { setAnchorEl(null); }}>
        <MenuItem selected={!released} onClick={() => { handleSelect(false); }}>
          {NOT_RELEASED_LABEL}
        </MenuItem>
        <MenuItem selected={released} onClick={() => { handleSelect(true); }}>
          {RELEASED_LABEL}
        </MenuItem>
      </Menu>
    </>
  );
};
`;

const BATCH_RELEASE = `// components/Events/EventsDataGrid.tsx — multi-select and the batch action.
// The grid is already a DataGridPro with a custom toolbar, so the release action
// is one more toolbar control gated on the selection being non-empty.

const [selection, setSelection] = useState<GridRowSelectionModel>({
  ids: new Set<GridRowId>(),
  type: "include",
});
const selectedIds = [...selection.ids].map(String);

const handleBatchRelease = (): void => {
  // Already-released meetings are skipped rather than re-written, so a mixed
  // selection is not an error case.
  const toRelease = events
    .filter((event) => selectedIds.includes(event.id) && !event.tabulationReleased)
    .map((event) => event.id);

  void releaseTabulation(toRelease, true).then(() => {
    setSelection({ ids: new Set<GridRowId>(), type: "include" });
  });
};

<DataGridPro
  checkboxSelection
  disableRowSelectionOnClick
  onRowSelectionModelChange={setSelection}
  rowSelectionModel={selection}
  slotProps={{
    toolbar: {
      onReleaseTabulation: handleBatchRelease,
      releaseDisabled: selectedIds.length === 0,
      selectedCount: selectedIds.length,
    },
  }}
  // …existing columns, filters, and toolbar…
/>
`;

const WITHHELD_SURFACES = `// The four withheld surfaces. Each reads the same context; none of them
// renders a zeroed version of what it would have shown.

// 1. app/[clientTicker]/meeting/[meetingId]/tabulation/page.tsx
if (!released) {
  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      <EmptyState title="Tabulation will be available 15 days before the meeting." />
    </Container>
  );
}

// 2. components/Charts/QuorumGauge/QuorumGaugeCard.tsx — empty state, not a
//    gauge at zero, and no quorum chip.
<CardContent sx={tabulationCardContentStartStyles}>
  {released ? (
    <>
      <Gauge value={representedPercent} />
      <GaugeCenterLabel />
    </>
  ) : (
    <EmptyState
      minHeight={220}
      title="Tabulation will be available 15 days before the meeting."
    />
  )}
</CardContent>

// 3. components/Meeting/TabulationTracker.tsx — placeholders for this year's
//    figures; last year's are published history and stay.
<HistoricalShareCard
  label="Shares Voted"
  currentValue={released ? votedMetric.display : "---"}
  alternateValue={released ? votedMetric.alternate : "---"}
  previousValue={previousVotedMetric?.display ?? null}
  previousAlternateValue={previousVotedMetric?.alternate ?? null}
  showPreviousYear={shouldShowPreviousYearInfo}
/>

// 4. The progress bar is dropped outright — an empty bar reads as "nobody has
//    voted" rather than as "we are not saying yet".
{released && <VoteProgressBar voted={votedPercent} />}
`;

export const CODE_SAMPLES: readonly CodeSample[] = [
  {
    code: RELEASE_FIELD,
    filename: "mock-api-server/openapi-schema/openapi.yaml",
    language: "text",
    satisfies: ["TAB-01", "TAB-02"],
    sectionId: "releasing-tabulation",
    title: "The tabulationReleased field",
  },
  {
    code: STATUS_CHIP,
    filename: "components/Events/EventDataGridCells.tsx",
    language: "tsx",
    satisfies: ["TAB-03", "TAB-04"],
    sectionId: "releasing-tabulation",
    title: "The selectable status chip",
  },
  {
    code: BATCH_RELEASE,
    filename: "components/Events/EventsDataGrid.tsx",
    language: "tsx",
    satisfies: ["TAB-05"],
    sectionId: "releasing-tabulation",
    title: "Multi-select and the batch release action",
  },
  {
    code: RELEASE_CONTEXT,
    filename: "contexts/TabulationReleaseContext.tsx",
    language: "tsx",
    satisfies: ["TAB-07"],
    sectionId: "withheld-tabulation-surfaces",
    title: "The release context, and where it mounts",
  },
  {
    code: INSIGHTS_GATE,
    filename: "hooks/useTabulationInsights.ts",
    language: "typescript",
    satisfies: ["TAB-06", "TAB-12"],
    sectionId: "withheld-tabulation-surfaces",
    title: "Gating the fetch rather than hiding the result",
  },
  {
    code: WITHHELD_SURFACES,
    filename: "components/Meeting/TabulationTracker.tsx",
    language: "tsx",
    satisfies: ["TAB-08", "TAB-09", "TAB-10", "TAB-11"],
    sectionId: "withheld-tabulation-surfaces",
    title: "The four withheld surfaces",
  },
];
