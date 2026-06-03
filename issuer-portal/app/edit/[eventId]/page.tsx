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
import React, { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";

import type { MailingStatus } from "@/components/Meeting/MailingTimelineCard";
import type { components } from "@/domain-models/generated-schema";

import { ClientFeaturesCard } from "@/components/Meeting/ClientFeaturesCard";
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

const meetingStatuses: MeetingStatus[] = ["ACTIVE", "COMPLETE", "ADJOURNED"];
const meetingTypes = ["Annual Meeting", "Special Meeting"];
const mailingStatuses: MailingStatus[] = [
  "Preparing for Mailing",
  "Proofing & Approval",
  "Mailing In Progress",
  "Mailing Completed",
];

const toDateInputValue = (value: string | null | undefined): string => value ?? "";

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
    typeof meeting.quorumRequirement === "number" ? String(meeting.quorumRequirement) : "",
  totalSharesOutstanding:
    meeting.totalSharesOutstanding != null ? String(meeting.totalSharesOutstanding) : "",
  brokerNonVote: typeof meeting.brokerNonVote === "number" ? String(meeting.brokerNonVote) : "",
  mailingStatus: (meeting.mailingStatus as MailingStatus | null) ?? "",
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

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const { mutate } = useSWRConfig();

  const returnUrl = searchParams.get("returnUrl");
  const isFromMeeting = returnUrl ? /\/(?:past-)?meeting\//.test(returnUrl) : false;
  const backLabel = isFromMeeting ? "Back to Event" : "Back to Events";
  const handleBack = () => router.push(returnUrl && isFromMeeting ? returnUrl : "/events");

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [positions, setPositions] = useState<PositionEdit[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [votingShares, setVotingShares] = useState({ totalShares: "", sharesVoted: "" });
  const [votingSharesDirty, setVotingSharesDirty] = useState(false);

  const authBypassed = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  const canEdit = session?.user?.type === "CSM" || authBypassed;

  useEffect(() => {
    if (!authBypassed && sessionStatus === "loading") return;

    if (!canEdit) {
      setLoading(false);
      return;
    }

    const loadMeeting = async () => {
      setLoading(true);
      setError(null);

      try {
        const api = await buildApiClient();
        const { data, error: fetchError } = await api.GET("/meetings/{meetingId}", {
          params: { path: { meetingId: eventId } },
        });

        const rawMeeting: unknown = data;
        if (fetchError || !isMeetingResponse(rawMeeting)) {
          throw new Error(getApiErrorMessage(fetchError, "Event not found"));
        }

        setMeeting(rawMeeting);
        setForm(toForm(rawMeeting));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load event");
      } finally {
        setLoading(false);
      }
    };

    void loadMeeting();
  }, [authBypassed, canEdit, eventId, sessionStatus]);

  const toPositionEdit = (p: Position): PositionEdit => ({
    id: p.id ?? "",
    name: p.name ?? p.accountType ?? "Position",
    voteStatus: p.voteStatus ?? "Unvoted",
    shares: p.shares != null ? String(p.shares) : "",
    sharesVoted: p.sharesVoted != null ? String(p.sharesVoted) : "0",
  });

  useEffect(() => {
    if (!canEdit || !eventId) return;

    const loadPositions = async () => {
      setPositionsLoading(true);
      try {
        const api = await buildApiClient();
        const { data } = await api.GET("/positions", {
          params: { query: { meetingId: eventId, limit: 50000 } },
        });
        const responseData = data as { positions?: Position[] } | Position[] | undefined;
        const raw = Array.isArray(responseData)
          ? responseData
          : ((responseData as { positions?: Position[] })?.positions ?? []);
        setPositions(raw.map(toPositionEdit));

        const totalShares = raw.reduce((sum, p) => sum + (Number(p.shares) || 0), 0);
        const totalVoted = raw
          .filter((p) => p.voteStatus === "Voted")
          .reduce((sum, p) => sum + (Number(p.sharesVoted) || 0), 0);
        setVotingShares({
          totalShares: String(totalShares),
          sharesVoted: String(totalVoted),
        });
      } catch {
        // Non-fatal
      } finally {
        setPositionsLoading(false);
      }
    };

    void loadPositions();
  }, [eventId, canEdit]);

  const pageTitle = useMemo(() => {
    if (!meeting) return "Edit Event";
    return `Edit ${meeting.ticker ?? "Event"} ${meeting.title ?? "Event"}`;
  }, [meeting]);

  const handleTextChange =
    (field: keyof EventForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => (current ? { ...current, [field]: value } : current));
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

    const brokerNonVote = form.brokerNonVote.trim() ? Number(form.brokerNonVote) : undefined;

    const updateBody: UpdateMeetingRequest = {
      title: form.title.trim(),
      cusip: form.cusip.trim(),
      brokerSearchDate: optionalDate(form.brokerSearchDate),
      recordDate: form.recordDate,
      mailingDate: form.mailingDate,
      meetingDate: form.meetingDate,
      cutoffDate: optionalDate(form.cutoffDate),
      meetingType: form.meetingType,
      status: form.status,
      quorumRequirement,
      totalSharesOutstanding: String(form.totalSharesOutstanding).trim() || undefined,
      brokerNonVote: brokerNonVote ?? null,
      mailingStatus: form.mailingStatus || null,
    };

    try {
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
        throw new Error("Event update did not persist. Check the configured API server.");
      }

      setMeeting(rawMeeting);
      setForm(toForm(rawMeeting));

      // Save shares voted
      // Strategy: find the largest 'Voted' position and set its sharesVoted so the
      // running total across all 'Voted' positions equals the entered value.
      // If no 'Voted' positions exist, promote the largest position to 'Voted'.
      if (votingSharesDirty && positions.length > 0) {
        const newTotal = Number(votingShares.sharesVoted) || 0;

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
          newSharesVoted = Math.max(newTotal - othersTotal, 0);
          newVoteStatus = newSharesVoted > 0 ? "Voted" : "Unvoted";
        } else {
          // No voted positions — promote the largest position
          const largest = [...positions].sort(
            (a, b) => (Number(b.shares) || 0) - (Number(a.shares) || 0),
          )[0];
          targetId = largest.id;
          newSharesVoted = newTotal;
          newVoteStatus = newTotal > 0 ? "Voted" : "Unvoted";
        }

        const api2 = await buildApiClient();
        await api2.PUT("/positions/{id}", {
          params: { path: { id: targetId } },
          body: {
            sharesVoted: newSharesVoted,
            voteStatus: newVoteStatus,
          } satisfies UpdatePositionRequest,
        });
        setVotingSharesDirty(false);
      }

      await mutate((key) => Array.isArray(key) && key[0] === "/events-list", undefined, {
        revalidate: true,
      });
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
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
                  <CircularProgress />
                </Box>
              ) : !canEdit ? (
                <Alert severity="warning">Only CSM users can edit events.</Alert>
              ) : error && !form ? (
                <Alert severity="error">{error}</Alert>
              ) : form ? (
                <Box component="form" id="edit-event-form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">Event updated.</Alert>}

                    <TextField
                      label="Meeting Title"
                      value={form.title}
                      onChange={handleTextChange("title")}
                      fullWidth
                      required
                      slotProps={{ input: { inputProps: { maxLength: 200 } as const } }}
                    />

                    <TextField
                      label="CUSIP"
                      value={form.cusip}
                      onChange={handleTextChange("cusip")}
                      fullWidth
                      required
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Event Type"
                        value={form.meetingType}
                        onChange={handleTextChange("meetingType")}
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
                        onChange={handleTextChange("status")}
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
                        onChange={handleTextChange("brokerSearchDate")}
                        fullWidth
                      />

                      <TextField
                        label="Record Date"
                        type="date"
                        value={form.recordDate}
                        onChange={handleTextChange("recordDate")}
                        fullWidth
                        required
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Mailing Date"
                        type="date"
                        value={form.mailingDate}
                        onChange={handleTextChange("mailingDate")}
                        fullWidth
                        required
                      />

                      <TextField
                        label="Event Date"
                        type="date"
                        value={form.meetingDate}
                        onChange={handleTextChange("meetingDate")}
                        fullWidth
                        required
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Cutoff Date"
                        type="date"
                        value={form.cutoffDate}
                        onChange={handleTextChange("cutoffDate")}
                        fullWidth
                      />

                      <TextField
                        label="Quorum Requirement (%)"
                        type="number"
                        value={form.quorumRequirement}
                        onChange={handleTextChange("quorumRequirement")}
                        fullWidth
                        required
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Total Shares Outstanding"
                        type="number"
                        value={form.totalSharesOutstanding}
                        onChange={handleTextChange("totalSharesOutstanding")}
                        fullWidth
                        helperText="Total shares eligible to vote"
                      />

                      <TextField
                        label="Broker Non-Vote"
                        type="number"
                        value={form.brokerNonVote}
                        onChange={handleTextChange("brokerNonVote")}
                        fullWidth
                        helperText="Total broker non-vote shares"
                      />
                    </Stack>

                    <TextField
                      select
                      id="mailing-status"
                      label="Mailing Status"
                      value={form.mailingStatus}
                      onChange={handleTextChange("mailingStatus")}
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
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
                          onChange={(e) => {
                            setVotingShares((prev) => ({
                              ...prev,
                              sharesVoted: e.target.value,
                            }));
                            setVotingSharesDirty(true);
                            setSuccess(false);
                          }}
                          helperText="Total shares voted across all positions"
                          sx={{ width: 260 }}
                          slotProps={{ input: { inputProps: { min: 0, step: 1 } } }}
                        />
                      )}
                    </Box>
                  </Stack>
                </Box>
              ) : (
                <Typography color="text.secondary">Event not found.</Typography>
              )}
            </CardContent>
            {form && canEdit && (
              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                <Button type="submit" form="edit-event-form" variant="contained" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>

        {meeting?.ticker && (
          <Grid size={{ xs: 12, md: 12, lg: 4 }}>
            <ClientFeaturesCard clientTicker={meeting.ticker} />
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
