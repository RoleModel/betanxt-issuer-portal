"use client";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsActiveIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import DrawerHeader from "@/components/Drawers/shared/DrawerHeader";
import { useNotifications } from "@/contexts/NotificationContext";
import buildApiClient from "@/domain-models/apiClient";

type TabulationDistribution = components["schemas"]["TabulationDistribution"];

interface TabulationDistributionDrawerProps {
  meetingId: string;
  clientTicker?: string | null;
  initialDistribution?: TabulationDistribution | null;
  meetingDate?: string | null;
}

const DRAWER_WIDTH = 420;

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeNextScheduled(
  meetingDate: string | null | undefined,
  startOffsetDays: number,
): string | null {
  if (!meetingDate) return null;
  const meeting = new Date(meetingDate);
  const start = new Date(meeting);
  start.setDate(meeting.getDate() - startOffsetDays);
  const now = new Date();
  if (start <= now && now < meeting) {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    return next.toISOString();
  }
  if (start > now) return start.toISOString();
  return null;
}

export function TabulationDistributionDrawer({
  meetingId,
  clientTicker: _clientTicker,
  initialDistribution,
  meetingDate,
}: TabulationDistributionDrawerProps) {
  const { data: session } = useSession();
  const isCSM = session?.user?.type === "CSM" || session?.user?.type === "ADMIN";
  const [open, setOpen] = useState(false);
  const [distribution, setDistribution] = useState<TabulationDistribution>(() => ({
    enabled: false,
    startOffsetDays: 15,
    recipients: [],
    lastSentAt: null,
    nextScheduledAt: null,
    ...initialDistribution,
  }));
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { fetchNotifications } = useNotifications();

  const initialDistributionRef = React.useRef(initialDistribution);
  useEffect(() => {
    // Only sync when the prop actually carries new server data (e.g. after a
    // full page refresh). Comparing by JSON ensures inline object literals
    // created on every render don't trigger a reset.
    const incoming = initialDistribution;
    const current = initialDistributionRef.current;
    if (incoming && JSON.stringify(incoming) !== JSON.stringify(current)) {
      initialDistributionRef.current = incoming;
      setDistribution((prev) => ({ ...prev, ...incoming }));
    }
  }, [initialDistribution]);

  const persistDistribution = useCallback(
    async (next: TabulationDistribution) => {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      try {
        const computed = computeNextScheduled(meetingDate, next.startOffsetDays ?? 15);
        const payload: TabulationDistribution = { ...next, nextScheduledAt: computed };
        const apiClient = await buildApiClient();
        const { error } = await apiClient.PUT("/meetings/{meetingId}", {
          params: { path: { meetingId } },
          body: { tabulationDistribution: payload },
        });
        if (error) {
          setSaveError("Failed to save settings");
        } else {
          setDistribution(payload);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        }
      } catch {
        setSaveError("Failed to save settings");
      } finally {
        setSaving(false);
      }
    },
    [meetingId, meetingDate],
  );

  const handleGenerateNotification = useCallback(async () => {
    setSendingNotif(true);
    setNotifResult(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const params = new URLSearchParams({ force: "true", meetingId });
      if (session?.user?.id) params.set("userId", session.user.id);
      const res = await fetch(`${apiBase}/cron/tabulation-distribute?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as {
        ok?: boolean;
        processed?: number;
        results?: {
          meetingId: string;
          notificationsCreated: number;
          emailsSent: number;
          skipped?: string;
        }[];
        error?: string;
        message?: string;
      };
      if (res.ok && json.ok) {
        const thisResult = json.results?.find((r) => r.meetingId === meetingId);
        if (thisResult?.skipped) {
          setNotifResult({ ok: false, message: `Skipped: ${thisResult.skipped}` });
        } else {
          const notifCount = thisResult?.notificationsCreated ?? 0;
          const emailCount = thisResult?.emailsSent ?? 0;
          setNotifResult({
            ok: true,
            message: `Distributed: ${notifCount} in-app notification${notifCount !== 1 ? "s" : ""} sent${emailCount > 0 ? `, ${emailCount} email${emailCount !== 1 ? "s" : ""} sent` : ""}.`,
          });
          await fetchNotifications();
        }
      } else {
        setNotifResult({
          ok: false,
          message: json.message ?? json.error ?? "Distribution failed",
        });
      }
    } catch (err) {
      setNotifResult({
        ok: false,
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSendingNotif(false);
      setTimeout(() => setNotifResult(null), 8000);
    }
  }, [meetingId, fetchNotifications]);

  const handleToggleEnabled = useCallback(() => {
    const next = { ...distribution, enabled: !distribution.enabled };
    setDistribution(next);
    void persistDistribution(next);
  }, [distribution, persistDistribution]);

  const handleOffsetChange = useCallback((value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 90) {
      setDistribution((prev) => ({ ...prev, startOffsetDays: num }));
    }
  }, []);

  const handleOffsetBlur = useCallback(() => {
    void persistDistribution(distribution);
  }, [distribution, persistDistribution]);

  const handleAddEmail = useCallback(() => {
    const email = emailInput.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (distribution.recipients?.includes(email)) {
      setEmailError("Email already added");
      return;
    }
    const next = {
      ...distribution,
      recipients: [...(distribution.recipients ?? []), email],
    };
    setEmailInput("");
    setEmailError(null);
    setDistribution(next);
    void persistDistribution(next);
  }, [emailInput, distribution, persistDistribution]);

  const handleRemoveEmail = useCallback(
    (email: string) => {
      const next = {
        ...distribution,
        recipients: (distribution.recipients ?? []).filter((r) => r !== email),
      };
      setDistribution(next);
      void persistDistribution(next);
    },
    [distribution, persistDistribution],
  );

  const computedNext = computeNextScheduled(meetingDate, distribution.startOffsetDays ?? 15);
  const isActive = distribution.enabled && !!computedNext;
  const recipientCount = (distribution.recipients ?? []).length;

  if (!isCSM) return null;

  return (
    <>
      {/* Compact trigger button shown inline on the page */}
      <Button
        variant="text"
        color={isActive ? "primary" : "inherit"}
        startIcon={
          isActive ? (
            <NotificationsActiveIcon fontSize="small" />
          ) : (
            <SettingsIcon fontSize="small" />
          )
        }
        onClick={() => setOpen(true)}
        aria-label="Configure daily tabulation distribution"
        sx={{ textTransform: "none", borderColor: "divider" }}
      >
        {isActive
          ? `Auto-distribute · ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`
          : "Configure distribution"}
      </Button>

      {/* Settings drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}
      >
        <DrawerHeader
          title="Daily Tabulation Distribution"
          subtitle="Prototype — automated report delivery"
          onClose={() => setOpen(false)}
        />

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sends the daily tabulation report to configured recipients during the window before the
            meeting date. Add at least one recipient email below, then enable auto-distribution.
            Reports are delivered each day at 8&nbsp;AM and can be triggered manually at any time.
          </Typography>

          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Enable toggle */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={distribution.enabled ?? false}
                      onChange={handleToggleEnabled}
                      disabled={saving}
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={500}>
                      Enable auto-distribution
                    </Typography>
                  }
                />
                {saving && <CircularProgress size={14} />}
                {isActive && (
                  <Chip label="Active" color="success" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Offset */}
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Delivery window
              </Typography>
              <TextField
                label="Days before meeting to start"
                type="number"
                size="small"
                fullWidth
                value={distribution.startOffsetDays ?? 15}
                onChange={(e) => handleOffsetChange(e.target.value)}
                onBlur={handleOffsetBlur}
                disabled={saving || !distribution.enabled}
                slotProps={{ input: { inputProps: { min: 1, max: 90 } } }}
                helperText="Delivery begins this many days before the meeting date and runs daily at 8 AM"
              />
            </Box>

            <Divider />

            {/* Recipients */}
            <Box>
              <Typography variant="subtitle2" mb={1.5}>
                Recipients
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="email@example.com"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                error={!!emailError}
                helperText={emailError ?? "Press Enter or click + to add"}
                disabled={saving || !distribution.enabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleAddEmail}
                          disabled={saving || !distribution.enabled || !emailInput.trim()}
                          aria-label="Add recipient"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box mt={1.5}>
                {(distribution.recipients ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.disabled">
                    No recipients added yet
                  </Typography>
                ) : (
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {(distribution.recipients ?? []).map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        size="small"
                        onDelete={() => handleRemoveEmail(email)}
                        deleteIcon={<DeleteIcon fontSize="small" aria-label={`Remove ${email}`} />}
                        disabled={saving || !distribution.enabled}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Schedule */}
            <Box>
              <Typography variant="subtitle2" mb={1.5}>
                Schedule
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Last sent
                  </Typography>
                  <Typography variant="body2">{formatDateTime(distribution.lastSentAt)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Next (computed)
                  </Typography>
                  <Typography variant="body2" color={isActive ? "text.primary" : "text.disabled"}>
                    {distribution.enabled ? formatDateTime(computedNext) : "Disabled"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {isActive && recipientCount > 0 && (
              <Alert severity="info" icon={<NotificationsActiveIcon fontSize="small" />}>
                A report will be sent to{" "}
                <strong>{(distribution.recipients ?? []).join(", ")}</strong> daily starting{" "}
                {distribution.startOffsetDays ?? 15} days before the meeting.
              </Alert>
            )}

            <Divider />

            {/* Trigger distribution */}
            <Box>
              <Button
                variant="outlined"
                startIcon={
                  sendingNotif ? (
                    <CircularProgress size={14} />
                  ) : (
                    <NotificationsActiveIcon fontSize="small" />
                  )
                }
                onClick={() => void handleGenerateNotification()}
                disabled={sendingNotif || saving || !distribution.enabled}
                sx={{ textTransform: "none" }}
              >
                {sendingNotif ? "Running…" : "Send distribution"}
              </Button>
              {!distribution.enabled && !saving && (
                <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                  Enable auto-distribution above to trigger
                </Typography>
              )}
              {saving && (
                <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                  Saving settings…
                </Typography>
              )}
              {notifResult && (
                <Alert severity={notifResult.ok ? "success" : "error"} sx={{ mt: 1.5 }}>
                  {notifResult.message}
                </Alert>
              )}
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
