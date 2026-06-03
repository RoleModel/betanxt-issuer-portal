"use client";

import { CheckCircle, Close, UploadFile } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useRef, useState } from "react";

import buildApiClient from "@/domain-models/apiClient";

interface NewClientDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const STEPS = ["Client Info", "Branding", "Initial User", "First Event"];
const MEETING_TYPES = ["Annual Meeting", "Special Meeting"];
const TRANSFER_AGENTS = [
  "Computershare",
  "Broadridge",
  "American Stock Transfer",
  "Equiniti",
  "Other",
];

interface ClientForm {
  ticker: string;
  companyName: string;
  shortName: string;
  industry: string;
  website: string;
}
interface BrandingForm {
  logoFile: File | null;
  logoPreview: string | null;
  primaryColor: string;
  secondaryColor: string;
}
interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}
interface EventForm {
  meetingType: string;
  meetingDate: string;
  recordDate: string;
  mailingDate: string;
  cusip: string;
  totalSharesOutstanding: string;
  quorumRequirement: string;
  transferAgent: string;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }

  return fallback;
}

const EMPTY_CLIENT: ClientForm = {
  ticker: "",
  companyName: "",
  shortName: "",
  industry: "",
  website: "",
};
const EMPTY_BRANDING: BrandingForm = {
  logoFile: null,
  logoPreview: null,
  primaryColor: "#1A3C5E",
  secondaryColor: "#E8A020",
};
const EMPTY_USER: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
};
const EMPTY_EVENT: EventForm = {
  meetingType: "Annual Meeting",
  meetingDate: "",
  recordDate: "",
  mailingDate: "",
  cusip: "",
  totalSharesOutstanding: "",
  quorumRequirement: "50",
  transferAgent: "Computershare",
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box
                component="input"
                type="color"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                sx={{
                  width: 28,
                  height: 28,
                  border: "none",
                  borderRadius: 1,
                  cursor: "pointer",
                  p: 0,
                  background: "none",
                }}
              />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function NewClientDrawer({ open, onClose, onCreated }: NewClientDrawerProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [clientForm, setClientForm] = useState<ClientForm>(EMPTY_CLIENT);
  const [brandingForm, setBrandingForm] = useState<BrandingForm>(EMPTY_BRANDING);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setStep(0);
    setError(null);
    setDone(false);
    setClientForm(EMPTY_CLIENT);
    setBrandingForm(EMPTY_BRANDING);
    setUserForm(EMPTY_USER);
    setEventForm(EMPTY_EVENT);
    onClose();
  }, [onClose]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBrandingForm((p) => ({
      ...p,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const canAdvance = useCallback((): boolean => {
    if (step === 0)
      return (
        clientForm.ticker.trim().length >= 1 &&
        clientForm.companyName.trim().length >= 2 &&
        clientForm.shortName.trim().length >= 2
      );
    if (step === 1) return true;
    if (step === 2)
      return (
        userForm.firstName.trim().length > 0 &&
        userForm.lastName.trim().length > 0 &&
        userForm.email.includes("@") &&
        userForm.username.trim().length >= 3 &&
        userForm.password.length >= 8
      );
    if (step === 3)
      return (
        eventForm.meetingDate.length > 0 &&
        eventForm.recordDate.length > 0 &&
        eventForm.mailingDate.length > 0 &&
        eventForm.cusip.trim().length > 0 &&
        eventForm.totalSharesOutstanding.trim().length > 0
      );
    return false;
  }, [step, clientForm, userForm, eventForm]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const api = await buildApiClient();

      let logoUrl: string | null = null;
      if (brandingForm.logoFile) {
        const fd = new FormData();
        fd.append("logo", brandingForm.logoFile);
        fd.append("ticker", clientForm.ticker.toUpperCase());
        const res = await fetch("/api/upload/client-logo", { method: "POST", body: fd });
        if (res.ok) logoUrl = ((await res.json()) as { url: string }).url;
      }

      const { data: clientData, error: clientError } = await api.POST("/clients", {
        body: {
          ticker: clientForm.ticker.toUpperCase(),
          companyName: clientForm.companyName.trim(),
          shortName: clientForm.shortName.trim(),
          industry: clientForm.industry.trim() || undefined,
          website: clientForm.website.trim() || undefined,
          logoUrl,
          primaryColor: brandingForm.primaryColor,
          secondaryColor: brandingForm.secondaryColor,
          isActive: true,
          enabledFeatures: [
            "documents",
            "mailing",
            "tabulation",
            "reports",
            "fileTransfer",
            "agenda",
          ],
        },
      });

      if (clientError || !clientData) {
        throw new Error(getApiErrorMessage(clientError, "Failed to create client"));
      }

      const clientId = clientData.id ?? "";
      if (!clientId) {
        throw new Error("Failed to create client: missing client id");
      }

      const { error: userError } = await api.POST("/users", {
        body: {
          firstName: userForm.firstName.trim(),
          lastName: userForm.lastName.trim(),
          email: userForm.email.trim(),
          username: userForm.username.trim(),
          password: userForm.password,
          type: "ISSUER",
        },
      });

      if (userError) {
        throw new Error(getApiErrorMessage(userError, "Failed to create user"));
      }

      const ticker = clientForm.ticker.toUpperCase();
      const year = new Date(eventForm.meetingDate).getFullYear();

      const { error: meetingError } = await api.POST("/meetings", {
        body: {
          id: `${ticker.toLowerCase()}-${eventForm.meetingType.toLowerCase().replace(/\s+/g, "-")}-${year}`,
          title: eventForm.meetingType,
          cusip: eventForm.cusip.trim(),
          ticker,
          recordDate: eventForm.recordDate,
          mailingDate: eventForm.mailingDate,
          meetingDate: eventForm.meetingDate,
          meetingType: eventForm.meetingType,
          meetingYear: year,
          distributionType: "NAA",
          transferAgent: eventForm.transferAgent,
          totalSharesOutstanding: eventForm.totalSharesOutstanding,
          quorumRequirement: Number(eventForm.quorumRequirement),
          clientId,
        },
      });

      if (meetingError) {
        throw new Error(getApiErrorMessage(meetingError, "Failed to create meeting"));
      }

      setDone(true);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 480 },
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          New Client
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </Box>

      {done ? (
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 4,
          }}
        >
          <CheckCircle sx={{ fontSize: 64, color: "success.main" }} />
          <Typography variant="h6" fontWeight={600}>
            Client Created
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            {clientForm.companyName} has been set up with a user account and first meeting.
          </Typography>
          <Button variant="contained" onClick={handleClose} sx={{ mt: 2 }}>
            Done
          </Button>
        </Box>
      ) : (
        <>
          {/* Stepper */}
          <Box sx={{ px: 3, pt: 2, pb: 1, flexShrink: 0 }}>
            <Stepper activeStep={step} alternativeLabel>
              {STEPS.map((label, i) => (
                <Step key={label} completed={i < step}>
                  <StepLabel>
                    <Typography variant="caption">{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <LinearProgress
            variant="determinate"
            value={((step + 1) / STEPS.length) * 100}
            sx={{ mx: 3, borderRadius: 1, flexShrink: 0 }}
          />

          {/* Scrollable content */}
          <Box sx={{ minHeight: 0, overflowY: "auto", px: 3, py: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {step === 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Basic information for the new client.
                </Typography>
                <TextField
                  label="Ticker Symbol *"
                  value={clientForm.ticker}
                  onChange={(e) =>
                    setClientForm((p) => ({ ...p, ticker: e.target.value.toUpperCase() }))
                  }
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 10 } }}
                  helperText="e.g. WEN, PAYC"
                />
                <TextField
                  label="Full Company Name *"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm((p) => ({ ...p, companyName: e.target.value }))}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Short Name *"
                  value={clientForm.shortName}
                  onChange={(e) => setClientForm((p) => ({ ...p, shortName: e.target.value }))}
                  size="small"
                  fullWidth
                  helperText="Display name used in the app"
                />
                <TextField
                  label="Industry"
                  value={clientForm.industry}
                  onChange={(e) => setClientForm((p) => ({ ...p, industry: e.target.value }))}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Website"
                  value={clientForm.website}
                  onChange={(e) => setClientForm((p) => ({ ...p, website: e.target.value }))}
                  size="small"
                  fullWidth
                  placeholder="https://"
                />
              </Stack>
            )}

            {step === 1 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Logo and brand colors — all optional.
                </Typography>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoChange}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 180,
                      height: 80,
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      bgcolor: "action.hover",
                      flexShrink: 0,
                      p: 3,
                    }}
                  >
                    {brandingForm.logoPreview ? (
                      <Box
                        component="img"
                        src={brandingForm.logoPreview}
                        alt="Logo"
                        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <UploadFile sx={{ color: "text.disabled" }} />
                    )}
                  </Box>
                  <Stack spacing={0.5}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<UploadFile />}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {brandingForm.logoFile ? "Change Logo" : "Upload Logo"}
                    </Button>
                    {brandingForm.logoFile && (
                      <Typography variant="caption" color="text.secondary">
                        {brandingForm.logoFile.name}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    overflow: "hidden",
                    display: "flex",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ flex: 1, bgcolor: brandingForm.primaryColor }} />
                  <Box sx={{ flex: 1, bgcolor: brandingForm.secondaryColor }} />
                </Box>
                <ColorField
                  label="Primary Color"
                  value={brandingForm.primaryColor}
                  onChange={(v) => setBrandingForm((p) => ({ ...p, primaryColor: v }))}
                />
                <ColorField
                  label="Secondary Color"
                  value={brandingForm.secondaryColor}
                  onChange={(v) => setBrandingForm((p) => ({ ...p, secondaryColor: v }))}
                />
              </Stack>
            )}

            {step === 2 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Initial ISSUER user for this client.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="First Name *"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm((p) => ({ ...p, firstName: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Last Name *"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm((p) => ({ ...p, lastName: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Email *"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Username *"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                  }
                  size="small"
                  fullWidth
                  helperText="Min. 3 characters, lowercase"
                />
                <TextField
                  label="Password *"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                  size="small"
                  fullWidth
                  helperText="Min. 8 characters"
                />
                <Alert severity="info" sx={{ py: 0.5 }}>
                  User will be created with <strong>ISSUER</strong> role.
                </Alert>
              </Stack>
            )}

            {step === 3 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  First shareholder meeting for this client.
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Meeting Type</InputLabel>
                  <Select
                    label="Meeting Type"
                    value={eventForm.meetingType}
                    onChange={(e) => setEventForm((p) => ({ ...p, meetingType: e.target.value }))}
                  >
                    {MEETING_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="CUSIP *"
                  value={eventForm.cusip}
                  onChange={(e) => setEventForm((p) => ({ ...p, cusip: e.target.value }))}
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { maxLength: 9 } }}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Record Date *"
                    type="date"
                    value={eventForm.recordDate}
                    onChange={(e) => setEventForm((p) => ({ ...p, recordDate: e.target.value }))}
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Mailing Date *"
                    type="date"
                    value={eventForm.mailingDate}
                    onChange={(e) => setEventForm((p) => ({ ...p, mailingDate: e.target.value }))}
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
                <TextField
                  label="Meeting Date *"
                  type="date"
                  value={eventForm.meetingDate}
                  onChange={(e) => setEventForm((p) => ({ ...p, meetingDate: e.target.value }))}
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Total Shares Outstanding *"
                  type="number"
                  value={eventForm.totalSharesOutstanding}
                  onChange={(e) =>
                    setEventForm((p) => ({
                      ...p,
                      totalSharesOutstanding: e.target.value,
                    }))
                  }
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Quorum Requirement"
                  type="number"
                  value={eventForm.quorumRequirement}
                  onChange={(e) =>
                    setEventForm((p) => ({ ...p, quorumRequirement: e.target.value }))
                  }
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    },
                  }}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Transfer Agent</InputLabel>
                  <Select
                    label="Transfer Agent"
                    value={eventForm.transferAgent}
                    onChange={(e) => setEventForm((p) => ({ ...p, transferAgent: e.target.value }))}
                  >
                    {TRANSFER_AGENTS.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Transfer agent managing shares</FormHelperText>
                </FormControl>
              </Stack>
            )}
          </Box>

          {/* Footer — sticky */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Button onClick={() => setStep((s) => s - 1)} disabled={step === 0 || submitting}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Tooltip title={canAdvance() ? "" : "Please fill in all required fields"}>
                <span>
                  <Button
                    variant="contained"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canAdvance()}
                  >
                    Next
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={canAdvance() ? "" : "Please fill in all required fields"}>
                <span>
                  <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={!canAdvance() || submitting}
                    startIcon={
                      submitting ? <CircularProgress size={16} color="inherit" /> : undefined
                    }
                  >
                    {submitting ? "Creating…" : "Create Client"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </>
      )}
    </Drawer>
  );
}
