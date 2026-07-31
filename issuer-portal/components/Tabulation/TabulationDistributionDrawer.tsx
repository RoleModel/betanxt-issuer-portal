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
import { useCallback, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import DrawerHeader from "@/components/Drawers/shared/DrawerHeader";
import { useNotifications } from "@/contexts/NotificationContext";
import buildApiClient from "@/domain-models/apiClient";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

type TabulationDistribution = components["schemas"]["TabulationDistribution"];

interface NotifResult {
  readonly ok: boolean;
  readonly message: string;
}

interface TabulationDistributionDrawerProps {
  readonly meetingId: string;
  readonly clientTicker?: string | null;
  readonly initialDistribution?: TabulationDistribution | null;
  readonly meetingDate?: string | null;
}

const DRAWER_WIDTH = 420;

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function computeNextScheduled(
  meetingDate: string | null | undefined,
  startOffsetDays: number
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

interface UseTabulationDistributionResult {
  readonly distribution: TabulationDistribution;
  readonly emailInput: string;
  readonly emailError: string | null;
  readonly saving: boolean;
  readonly saveError: string | null;
  readonly saveSuccess: boolean;
  readonly sendingNotif: boolean;
  readonly notifResult: NotifResult | null;
  readonly computedNext: string | null;
  readonly isActive: boolean;
  readonly recipientCount: number;
  readonly handleToggleEnabled: () => void;
  readonly handleOffsetChange: (value: string) => void;
  readonly handleOffsetBlur: () => void;
  readonly handleEmailInputChange: (value: string) => void;
  readonly handleAddEmail: () => void;
  readonly handleRemoveEmail: (email: string) => void;
  readonly handleGenerateNotification: () => Promise<void>;
}

function useTabulationDistribution(
  meetingId: string,
  clientTicker: string | null | undefined,
  initialDistribution: TabulationDistribution | null | undefined,
  meetingDate: string | null | undefined
): UseTabulationDistributionResult {
  const { data: session } = useSession();
  const [distribution, setDistribution] = useState<TabulationDistribution>(
    () => ({
      enabled: false,
      startOffsetDays: 15,
      recipients: [],
      lastSentAt: null,
      nextScheduledAt: null,
      ...initialDistribution,
    })
  );
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifResult, setNotifResult] = useState<NotifResult | null>(null);

  const { fetchNotifications } = useNotifications();

  const persistDistribution = useCallback(
    async (next: TabulationDistribution) => {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      try {
        const computed = computeNextScheduled(
          meetingDate,
          next.startOffsetDays ?? 15
        );
        const payload: TabulationDistribution = {
          ...next,
          nextScheduledAt: computed,
        };
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
          setTimeout(() => {
            setSaveSuccess(false);
          }, 2500);
        }
      } catch {
        setSaveError("Failed to save settings");
      } finally {
        setSaving(false);
      }
    },
    [meetingId, meetingDate]
  );

  const handleGenerateNotification = useCallback(async () => {
    setSendingNotif(true);
    setNotifResult(null);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
      const params = new URLSearchParams({ force: "true", meetingId });
      if (session?.user?.id) params.set("userId", session.user.id);
      if (session?.user?.username)
        params.set("username", session.user.username);
      const res = await fetch(
        `${apiBase}/cron/tabulation-distribute?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        // fetch resolves on HTTP 4xx/5xx; read the API's structured error
        // payload for a useful message, falling back to the status code.
        let message = `Distribution failed (${res.status})`;
        try {
          const errBody = (await res.json()) as {
            error?: string;
            message?: string;
          };
          message = errBody.message ?? errBody.error ?? message;
        } catch {
          // Response body was not JSON; keep the status-based message.
        }
        setNotifResult({ ok: false, message });
        return;
      }
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
      if (json.ok) {
        const thisResult = json.results?.find((r) => r.meetingId === meetingId);
        if (thisResult?.skipped) {
          setNotifResult({
            ok: false,
            message: `Skipped: ${thisResult.skipped}`,
          });
        } else {
          const notifCount = thisResult?.notificationsCreated ?? 0;
          const emailCount = thisResult?.emailsSent ?? 0;
          setNotifResult({
            ok: true,
            message: `Distributed: ${notifCount} in-app notification${notifCount !== 1 ? "s" : ""} sent${emailCount > 0 ? `, ${emailCount} email${emailCount !== 1 ? "s" : ""} sent` : ""}.`,
          });
          await fetchNotifications({
            ticker: clientTicker ?? undefined,
            meetingId,
          });
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
      setTimeout(() => {
        setNotifResult(null);
      }, 8000);
    }
  }, [
    meetingId,
    clientTicker,
    fetchNotifications,
    session?.user?.id,
    session?.user?.username,
  ]);

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

  const handleEmailInputChange = useCallback((value: string) => {
    setEmailInput(value);
    setEmailError(null);
  }, []);

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
    [distribution, persistDistribution]
  );

  const computedNext = computeNextScheduled(
    meetingDate,
    distribution.startOffsetDays ?? 15
  );
  const isActive = !!distribution.enabled && !!computedNext;
  const recipientCount = (distribution.recipients ?? []).length;

  return {
    distribution,
    emailInput,
    emailError,
    saving,
    saveError,
    saveSuccess,
    sendingNotif,
    notifResult,
    computedNext,
    isActive,
    recipientCount,
    handleToggleEnabled,
    handleOffsetChange,
    handleOffsetBlur,
    handleEmailInputChange,
    handleAddEmail,
    handleRemoveEmail,
    handleGenerateNotification,
  };
}

const TabulationDistributionDrawerContent = ({
  meetingId,
  clientTicker,
  initialDistribution,
  meetingDate,
}: TabulationDistributionDrawerProps) => {
  const { data: session } = useSession();
  const { flags } = useFeatureFlags(clientTicker ?? undefined);
  const isCSM =
    session?.user?.type === "CSM" || session?.user?.type === "ADMIN";
  const [open, setOpen] = useState(false);

  const {
    distribution,
    emailInput,
    emailError,
    saving,
    saveError,
    saveSuccess,
    sendingNotif,
    notifResult,
    computedNext,
    isActive,
    recipientCount,
    handleToggleEnabled,
    handleOffsetChange,
    handleOffsetBlur,
    handleEmailInputChange,
    handleAddEmail,
    handleRemoveEmail,
    handleGenerateNotification,
  } = useTabulationDistribution(
    meetingId,
    clientTicker,
    initialDistribution,
    meetingDate
  );

  if (!isCSM || !flags.configureDistribution) return null;

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
        onClick={() => {
          setOpen(true);
        }}
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
        onClose={() => {
          setOpen(false);
        }}
        slotProps={{ paper: { sx: { width: DRAWER_WIDTH } } }}
      >
        <DrawerHeader
          title="Daily Tabulation Distribution"
          subtitle="Prototype — automated report delivery"
          onClose={() => {
            setOpen(false);
          }}
        />

        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sends the daily tabulation report to configured recipients during
            the window before the meeting date. Add at least one recipient email
            below, then enable auto-distribution. Reports are delivered each day
            at 8&nbsp;AM and can be triggered manually at any time.
          </Typography>

          {saveError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          ) : null}
          {saveSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved
            </Alert>
          ) : null}

          <Stack spacing={3}>
            <EnableSection
              enabled={distribution.enabled ?? false}
              saving={saving}
              isActive={isActive}
              onToggle={handleToggleEnabled}
            />

            <Divider />

            <OffsetSection
              startOffsetDays={distribution.startOffsetDays ?? 15}
              enabled={distribution.enabled ?? false}
              saving={saving}
              onOffsetChange={handleOffsetChange}
              onOffsetBlur={handleOffsetBlur}
            />

            <Divider />

            <RecipientsSection
              recipients={distribution.recipients ?? []}
              enabled={distribution.enabled ?? false}
              saving={saving}
              emailInput={emailInput}
              emailError={emailError}
              onEmailInputChange={handleEmailInputChange}
              onAddEmail={handleAddEmail}
              onRemoveEmail={handleRemoveEmail}
            />

            <Divider />

            <ScheduleSection
              lastSentAt={distribution.lastSentAt}
              enabled={distribution.enabled ?? false}
              isActive={isActive}
              computedNext={computedNext}
            />

            {isActive && recipientCount > 0 ? (
              <Alert
                severity="info"
                icon={<NotificationsActiveIcon fontSize="small" />}
              >
                A report will be sent to{" "}
                <strong>{(distribution.recipients ?? []).join(", ")}</strong>{" "}
                daily starting {distribution.startOffsetDays ?? 15} days before
                the meeting.
              </Alert>
            ) : null}

            <Divider />

            <TriggerSection
              sendingNotif={sendingNotif}
              saving={saving}
              enabled={distribution.enabled ?? false}
              notifResult={notifResult}
              onSend={() => void handleGenerateNotification()}
            />
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export const TabulationDistributionDrawer = ({
  meetingId,
  clientTicker,
  initialDistribution,
  meetingDate,
}: TabulationDistributionDrawerProps) => {
  // Re-seed local editing state from the server whenever the incoming
  // distribution actually changes by remounting the stateful subtree with a
  // key (instead of syncing state in an effect, which briefly shows stale
  // values). Serializing by content keeps inline object literals from the
  // parent from forcing spurious remounts.
  const distributionKey = JSON.stringify(initialDistribution ?? null);

  return (
    <TabulationDistributionDrawerContent
      key={distributionKey}
      meetingId={meetingId}
      clientTicker={clientTicker}
      initialDistribution={initialDistribution}
      meetingDate={meetingDate}
    />
  );
};

interface EnableSectionProps {
  readonly enabled: boolean;
  readonly saving: boolean;
  readonly isActive: boolean;
  readonly onToggle: () => void;
}

const EnableSection = ({
  enabled,
  saving,
  isActive,
  onToggle,
}: EnableSectionProps) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1}>
      <FormControlLabel
        control={
          <Switch checked={enabled} onChange={onToggle} disabled={saving} />
        }
        label={
          <Typography variant="body2" fontWeight={500}>
            Enable auto-distribution
          </Typography>
        }
      />
      {saving ? <CircularProgress size={14} /> : null}
      {isActive ? (
        <Chip label="Active" color="success" size="small" variant="outlined" />
      ) : null}
    </Stack>
  </Box>
);

interface OffsetSectionProps {
  readonly startOffsetDays: number;
  readonly enabled: boolean;
  readonly saving: boolean;
  readonly onOffsetChange: (value: string) => void;
  readonly onOffsetBlur: () => void;
}

const OffsetSection = ({
  startOffsetDays,
  enabled,
  saving,
  onOffsetChange,
  onOffsetBlur,
}: OffsetSectionProps) => (
  <Box>
    <Typography variant="subtitle2" mb={1}>
      Delivery window
    </Typography>
    <TextField
      label="Days before meeting to start"
      type="number"
      size="small"
      fullWidth
      value={startOffsetDays}
      onChange={(e) => {
        onOffsetChange(e.target.value);
      }}
      onBlur={onOffsetBlur}
      disabled={saving || !enabled}
      slotProps={{ input: { inputProps: { min: 1, max: 90 } } }}
      helperText="Delivery begins this many days before the meeting date and runs daily at 8 AM"
    />
  </Box>
);

interface RecipientsSectionProps {
  readonly recipients: readonly string[];
  readonly enabled: boolean;
  readonly saving: boolean;
  readonly emailInput: string;
  readonly emailError: string | null;
  readonly onEmailInputChange: (value: string) => void;
  readonly onAddEmail: () => void;
  readonly onRemoveEmail: (email: string) => void;
}

const RecipientsSection = ({
  recipients,
  enabled,
  saving,
  emailInput,
  emailError,
  onEmailInputChange,
  onAddEmail,
  onRemoveEmail,
}: RecipientsSectionProps) => (
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
        onEmailInputChange(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onAddEmail();
        }
      }}
      error={!!emailError}
      helperText={emailError ?? "Press Enter or click + to add"}
      disabled={saving || !enabled}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onAddEmail}
                disabled={saving || !enabled || !emailInput.trim()}
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
      {recipients.length === 0 ? (
        <Typography variant="body2" color="text.disabled">
          No recipients added yet
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {recipients.map((email) => (
            <Chip
              key={email}
              label={email}
              size="small"
              onDelete={() => {
                onRemoveEmail(email);
              }}
              deleteIcon={
                <DeleteIcon fontSize="small" aria-label={`Remove ${email}`} />
              }
              disabled={saving || !enabled}
            />
          ))}
        </Stack>
      )}
    </Box>
  </Box>
);

interface ScheduleSectionProps {
  readonly lastSentAt: string | null | undefined;
  readonly enabled: boolean;
  readonly isActive: boolean;
  readonly computedNext: string | null;
}

const ScheduleSection = ({
  lastSentAt,
  enabled,
  isActive,
  computedNext,
}: ScheduleSectionProps) => (
  <Box>
    <Typography variant="subtitle2" mb={1.5}>
      Schedule
    </Typography>
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Last sent
        </Typography>
        <Typography variant="body2">{formatDateTime(lastSentAt)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          Next (computed)
        </Typography>
        <Typography
          variant="body2"
          color={isActive ? "text.primary" : "text.disabled"}
        >
          {enabled ? formatDateTime(computedNext) : "Disabled"}
        </Typography>
      </Stack>
    </Stack>
  </Box>
);

interface TriggerSectionProps {
  readonly sendingNotif: boolean;
  readonly saving: boolean;
  readonly enabled: boolean;
  readonly notifResult: NotifResult | null;
  readonly onSend: () => void;
}

const TriggerSection = ({
  sendingNotif,
  saving,
  enabled,
  notifResult,
  onSend,
}: TriggerSectionProps) => (
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
      onClick={onSend}
      disabled={sendingNotif || saving || !enabled}
      sx={{ textTransform: "none" }}
    >
      {sendingNotif ? "Running…" : "Send distribution"}
    </Button>
    {!enabled && !saving && (
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        mt={0.5}
      >
        Enable auto-distribution above to trigger
      </Typography>
    )}
    {saving ? (
      <Typography
        variant="caption"
        color="text.disabled"
        display="block"
        mt={0.5}
      >
        Saving settings…
      </Typography>
    ) : null}
    {notifResult ? (
      <Alert severity={notifResult.ok ? "success" : "error"} sx={{ mt: 1.5 }}>
        {notifResult.message}
      </Alert>
    ) : null}
  </Box>
);
