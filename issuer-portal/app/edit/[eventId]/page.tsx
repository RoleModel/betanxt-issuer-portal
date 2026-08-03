"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";

import type { MailingStatus } from "@/components/Meeting/MailingTimelineCard";
import type { components } from "@/domain-models/generated-schema";

import { ClientFeaturesCard } from "@/components/Meeting/ClientFeaturesCard";
import { toMailingStatus } from "@/components/Meeting/mailingTimeline";
import buildApiClient from "@/domain-models/apiClient";

type Meeting = components["schemas"]["Meeting"];
type MeetingStatus = components["schemas"]["MeetingStatus"];
type UpdateMeetingRequest = components["schemas"]["UpdateMeetingRequest"];
type Position = components["schemas"]["Position"];
type UpdatePositionRequest = components["schemas"]["UpdatePositionRequest"];

interface PositionEdit {
  id: string;
  name: string;
  voteStatus: "Voted" | "Unvoted";
  shares: string;
  sharesVoted: string;
}

interface EventForm {
  title: string;
  cusip: string;
  brokerSearchDate: string;
  recordDate: string;
  mailingDate: string;
  meetingDate: string;
  cutoffDate: string;
  meetingType: string;
  status: MeetingStatus;
  quorumRequirement: string;
  totalSharesOutstanding: string;
  brokerNonVote: string;
  mailingStatus: MailingStatus | "";
}

interface VotingShares {
  totalShares: string;
  sharesVoted: string;
}

const meetingStatuses: MeetingStatus[] = ["ACTIVE", "COMPLETE", "ADJOURNED"];
const meetingTypes = ["Annual Meeting", "Special Meeting"];
const mailingStatuses: MailingStatus[] = [
  "Preparing for Mailing",
  "Proofing & Approval",
  "Mailing In Progress",
  "Mailing Completed",
];

const toDateInputValue = (value: string | null | undefined): string =>
  value ?? "";

const toForm = (meeting: Meeting): EventForm => ({
  title: meeting.title ?? "",
  cusip: meeting.cusip ?? "",
  brokerSearchDate: toDateInputValue(meeting.brokerSearchDate),
  recordDate: toDateInputValue(meeting.recordDate),
  mailingDate: toDateInputValue(meeting.mailingDate),
  meetingDate: toDateInputValue(meeting.meetingDate),
  cutoffDate: toDateInputValue(meeting.cutoffDate),
  meetingType: meeting.meetingType ?? "Annual Meeting",
  status: meeting.status ?? "ACTIVE",
  quorumRequirement:
    typeof meeting.quorumRequirement === "number"
      ? String(meeting.quorumRequirement)
      : "",
  totalSharesOutstanding:
    meeting.totalSharesOutstanding != null
      ? String(meeting.totalSharesOutstanding)
      : "",
  brokerNonVote:
    typeof meeting.brokerNonVote === "number"
      ? String(meeting.brokerNonVote)
      : "",
  mailingStatus: toMailingStatus(meeting.mailingStatus) ?? "",
});

const optionalDate = (value: string): string | undefined =>
  value.trim() ? value.trim() : undefined;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error;
    if (typeof message === "string") return message;
  }

  return fallback;
};

const isMeetingResponse = (value: unknown): value is Meeting => {
  if (!value || typeof value !== "object") return false;
  if (!("id" in value)) return false;

  return typeof value.id === "string";
};

const toPositionEdit = (p: Position): PositionEdit => ({
  id: p.id ?? "",
  name: p.name ?? p.accountType ?? "Position",
  voteStatus: p.voteStatus ?? "Unvoted",
  shares: p.shares != null ? String(p.shares) : "",
  sharesVoted: p.sharesVoted != null ? String(p.sharesVoted) : "0",
});

// Persist the entered "shares voted" total across positions.
// Strategy: find the largest 'Voted' position and set its sharesVoted so the
// running total across all 'Voted' positions equals the entered value.
// If no 'Voted' positions exist, promote the largest position to 'Voted'.
const persistVotingShares = async (
  positions: PositionEdit[],
  sharesVotedTotal: number
): Promise<void> => {
  const votedPositions = [...positions]
    .filter((p) => p.voteStatus === "Voted")
    .sort((a, b) => (Number(b.shares) || 0) - (Number(a.shares) || 0));

  let targetId: string;
  let newSharesVoted: number;
  let newVoteStatus: "Voted" | "Unvoted";

  if (votedPositions.length > 0) {
    const primary = votedPositions[0];
    const othersTotal = votedPositions
      .slice(1)
      .reduce((sum, p) => sum + (Number(p.sharesVoted) || 0), 0);
    targetId = primary.id;
    newSharesVoted = Math.max(sharesVotedTotal - othersTotal, 0);
    newVoteStatus = newSharesVoted > 0 ? "Voted" : "Unvoted";
  } else {
    // No voted positions — promote the largest position
    const largest = [...positions].sort(
      (a, b) => (Number(b.shares) || 0) - (Number(a.shares) || 0)
    )[0];
    targetId = largest.id;
    newSharesVoted = sharesVotedTotal;
    newVoteStatus = sharesVotedTotal > 0 ? "Voted" : "Unvoted";
  }

  const api = await buildApiClient();
  await api.PUT("/positions/{id}", {
    params: { path: { id: targetId } },
    body: {
      sharesVoted: newSharesVoted,
      voteStatus: newVoteStatus,
    } satisfies UpdatePositionRequest,
  });
};

const buildUpdateBody = (form: EventForm): UpdateMeetingRequest => {
  const brokerNonVote = form.brokerNonVote.trim()
    ? Number(form.brokerNonVote)
    : undefined;

  return {
    title: form.title.trim(),
    cusip: form.cusip.trim(),
    brokerSearchDate: optionalDate(form.brokerSearchDate),
    recordDate: form.recordDate,
    mailingDate: form.mailingDate,
    meetingDate: form.meetingDate,
    cutoffDate: optionalDate(form.cutoffDate),
    meetingType: form.meetingType,
    status: form.status,
    quorumRequirement: Number(form.quorumRequirement),
    totalSharesOutstanding:
      String(form.totalSharesOutstanding).trim() || undefined,
    brokerNonVote: brokerNonVote ?? null,
    mailingStatus: form.mailingStatus || null,
  };
};

const saveMeeting = async (
  eventId: string,
  updateBody: UpdateMeetingRequest
): Promise<Meeting> => {
  const api = await buildApiClient();
  const { data, error: updateError } = await api.PUT("/meetings/{meetingId}", {
    params: { path: { meetingId: eventId } },
    body: updateBody,
  });

  const rawMeeting: unknown = data;
  if (updateError || !isMeetingResponse(rawMeeting)) {
    throw new Error(getApiErrorMessage(updateError, "Event update failed"));
  }

  if (
    rawMeeting.id !== eventId ||
    rawMeeting.title !== updateBody.title ||
    rawMeeting.meetingType !== updateBody.meetingType
  ) {
    throw new Error(
      "Event update did not persist. Check the configured API server."
    );
  }

  return rawMeeting;
};

const EditEventContent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const { mutate } = useSWRConfig();

  const returnUrl = searchParams.get("returnUrl");
  const isFromMeeting = returnUrl
    ? /\/(?:past-)?meeting\//.test(returnUrl)
    : false;
  const backLabel = isFromMeeting ? "Back to Event" : "Back to Events";
  const handleBack = () => {
    router.push(returnUrl && isFromMeeting ? returnUrl : "/events");
  };

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [positions, setPositions] = useState<PositionEdit[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [votingShares, setVotingShares] = useState<VotingShares>({
    totalShares: "",
    sharesVoted: "",
  });
  const votingSharesDirty = useRef(false);

  const authBypassed = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  const canEdit = session?.user?.type === "CSM" || authBypassed;

  useEffect(() => {
    if (!authBypassed && sessionStatus === "loading") return;

    if (!canEdit) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadMeeting = async () => {
      setLoading(true);
      setError(null);

      try {
        const api = await buildApiClient();
        const { data, error: fetchError } = await api.GET(
          "/meetings/{meetingId}",
          {
            params: { path: { meetingId: eventId } },
          }
        );

        const rawMeeting: unknown = data;
        if (fetchError || !isMeetingResponse(rawMeeting)) {
          throw new Error(getApiErrorMessage(fetchError, "Event not found"));
        }

        if (ignore) return;
        setMeeting(rawMeeting);
        setForm(toForm(rawMeeting));
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Unable to load event");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void loadMeeting();

    return () => {
      ignore = true;
    };
  }, [authBypassed, canEdit, eventId, sessionStatus]);

  useEffect(() => {
    if (!canEdit || !eventId) return;

    let ignore = false;

    const loadPositions = async () => {
      setPositionsLoading(true);
      try {
        const api = await buildApiClient();
        const { data } = await api.GET("/positions", {
          params: { query: { meetingId: eventId, limit: 50000 } },
        });
        const responseData = data as
          { positions?: Position[] } | Position[] | undefined;
        const raw = Array.isArray(responseData)
          ? responseData
          : ((responseData as { positions?: Position[] })?.positions ?? []);

        if (!ignore) {
          setPositions(raw.map(toPositionEdit));

          const totalShares = raw.reduce(
            (sum, p) => sum + (Number(p.shares) || 0),
            0
          );
          const totalVoted = raw
            .filter((p) => p.voteStatus === "Voted")
            .reduce((sum, p) => sum + (Number(p.sharesVoted) || 0), 0);
          setVotingShares({
            totalShares: String(totalShares),
            sharesVoted: String(totalVoted),
          });
        }
      } catch {
        // Non-fatal
      } finally {
        if (!ignore) setPositionsLoading(false);
      }
    };

    void loadPositions();

    return () => {
      ignore = true;
    };
  }, [eventId, canEdit]);

  const pageTitle = useMemo(() => {
    if (!meeting) return "Edit Event";
    return `Edit ${meeting.ticker ?? "Event"} ${meeting.title ?? "Event"}`;
  }, [meeting]);

  const handleTextChange =
    (field: keyof EventForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setForm((current) =>
        current ? { ...current, [field]: value } : current
      );
      setSuccess(false);
    };

  const handleSharesVotedChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setVotingShares((prev) => ({
      ...prev,
      sharesVoted: value,
    }));
    votingSharesDirty.current = true;
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    const quorumRequirement = Number(form.quorumRequirement);
    if (!Number.isFinite(quorumRequirement) || quorumRequirement <= 0) {
      setError("Quorum requirement must be a positive percentage.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await saveMeeting(eventId, buildUpdateBody(form));
      setMeeting(updated);
      setForm(toForm(updated));

      // Save shares voted
      if (votingSharesDirty.current && positions.length > 0) {
        const newTotal = Number(votingShares.sharesVoted) || 0;
        await persistVotingShares(positions, newTotal);
        votingSharesDirty.current = false;
      }

      await mutate(
        (key) => Array.isArray(key) && key[0] === "/events-list",
        undefined,
        {
          revalidate: true,
        }
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Button variant="text" onClick={handleBack} sx={{ mb: 2 }}>
        {backLabel}
      </Button>
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            md: 12,
            lg: 8,
          }}
        >
          <Card>
            <CardHeader
              title={pageTitle}
              subheader={
                meeting?.ticker && meeting?.cusip
                  ? `${meeting.ticker} - CUSIP ${meeting.cusip}`
                  : undefined
              }
            />
            <CardContent>
              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minHeight={240}
                >
                  <CircularProgress />
                </Box>
              ) : !canEdit ? (
                <Alert severity="warning">
                  Only CSM users can edit events.
                </Alert>
              ) : error && !form ? (
                <Alert severity="error">{error}</Alert>
              ) : form ? (
                <EditEventForm
                  form={form}
                  error={error}
                  success={success}
                  positionsLoading={positionsLoading}
                  positions={positions}
                  votingShares={votingShares}
                  onSubmit={handleSubmit}
                  onTextChange={handleTextChange}
                  onSharesVotedChange={handleSharesVotedChange}
                />
              ) : (
                <Typography color="text.secondary">Event not found.</Typography>
              )}
            </CardContent>
            {form && canEdit ? (
              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button
                  type="submit"
                  form="edit-event-form"
                  variant="contained"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardActions>
            ) : null}
          </Card>
        </Grid>

        {meeting?.ticker ? (
          <Grid size={{ xs: 12, md: 12, lg: 4 }}>
            <ClientFeaturesCard
              key={meeting.ticker}
              clientTicker={meeting.ticker}
            />
          </Grid>
        ) : null}
      </Grid>
    </Container>
  );
};

interface EditEventFormProps {
  readonly form: EventForm;
  readonly error: string | null;
  readonly success: boolean;
  readonly positionsLoading: boolean;
  readonly positions: PositionEdit[];
  readonly votingShares: VotingShares;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly onTextChange: (
    field: keyof EventForm
  ) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  readonly onSharesVotedChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const EditEventForm = ({
  form,
  error,
  success,
  positionsLoading,
  positions,
  votingShares,
  onSubmit,
  onTextChange,
  onSharesVotedChange,
}: EditEventFormProps) => (
  <Box component="form" id="edit-event-form" onSubmit={onSubmit}>
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">Event updated.</Alert> : null}

      <TextField
        label="Meeting Title"
        value={form.title}
        onChange={onTextChange("title")}
        fullWidth
        required
        slotProps={{
          input: { inputProps: { maxLength: 200 } as const },
        }}
      />

      <TextField
        label="CUSIP"
        value={form.cusip}
        onChange={onTextChange("cusip")}
        fullWidth
        required
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          select
          label="Event Type"
          value={form.meetingType}
          onChange={onTextChange("meetingType")}
          fullWidth
          required
        >
          {meetingTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Status"
          value={form.status}
          onChange={onTextChange("status")}
          fullWidth
          required
        >
          {meetingStatuses.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Broker Search Date"
          type="date"
          value={form.brokerSearchDate}
          onChange={onTextChange("brokerSearchDate")}
          fullWidth
        />

        <TextField
          label="Record Date"
          type="date"
          value={form.recordDate}
          onChange={onTextChange("recordDate")}
          fullWidth
          required
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Mailing Date"
          type="date"
          value={form.mailingDate}
          onChange={onTextChange("mailingDate")}
          fullWidth
          required
        />

        <TextField
          label="Event Date"
          type="date"
          value={form.meetingDate}
          onChange={onTextChange("meetingDate")}
          fullWidth
          required
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Cutoff Date"
          type="date"
          value={form.cutoffDate}
          onChange={onTextChange("cutoffDate")}
          fullWidth
        />

        <TextField
          label="Quorum Requirement (%)"
          type="number"
          value={form.quorumRequirement}
          onChange={onTextChange("quorumRequirement")}
          fullWidth
          required
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Total Shares Outstanding"
          type="number"
          value={form.totalSharesOutstanding}
          onChange={onTextChange("totalSharesOutstanding")}
          fullWidth
          helperText="Total shares eligible to vote"
        />

        <TextField
          label="Broker Non-Vote"
          type="number"
          value={form.brokerNonVote}
          onChange={onTextChange("brokerNonVote")}
          fullWidth
          helperText="Total broker non-vote shares"
        />
      </Stack>

      <TextField
        select
        id="mailing-status"
        label="Mailing Status"
        value={form.mailingStatus}
        onChange={onTextChange("mailingStatus")}
        fullWidth
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {mailingStatuses.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>

      <Divider />

      {/* Voting Shares Section */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Voting Shares
        </Typography>

        {positionsLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 1,
            }}
          >
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Loading position data…
            </Typography>
          </Box>
        ) : positions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No positions found for this meeting.
          </Typography>
        ) : (
          <TextField
            label="Shares Voted"
            type="number"
            value={votingShares.sharesVoted}
            onChange={onSharesVotedChange}
            helperText="Total shares voted across all positions"
            sx={{ width: 260 }}
            slotProps={{
              input: { inputProps: { min: 0, step: 1 } },
            }}
          />
        )}
      </Box>
    </Stack>
  </Box>
);

const EditEventPage = () => (
  <Suspense
    fallback={
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={240}
        >
          <CircularProgress />
        </Box>
      </Container>
    }
  >
    <EditEventContent />
  </Suspense>
);

export default EditEventPage;
