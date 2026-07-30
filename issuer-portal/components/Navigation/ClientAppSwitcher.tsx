"use client";

import { ArrowDropDownOutlined } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";

import type { Client } from "@/hooks/useClients";
import type { EventRow } from "@/utils/eventData";

import { useClient } from "@/contexts/ClientContext";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { canUserSwitchClients, isIssuerUser } from "@/utils/isIssuerUser";

/** Brand labels for multi-client user types when no event is selected */
const USER_TYPE_BRAND_LABELS: Record<string, string> = {
  PARENT_CLIENT: "Donnelley Financial Solutions",
  SOLICITOR: "Morrow Sodali",
  CSM: "BetaNXT",
};

/**
 * Switch button for PARENT_CLIENT / SOLICITOR / CSM users.
 * - On /events: PARENT_CLIENT / SOLICITOR see brand name only; CSM gets a dropdown
 *   (assigned clients + search any client).
 * - On client/meeting routes: shows the issuer name with a dropdown of event companies.
 * - For CSM: additionally shows a searchable Autocomplete for all clients
 *   and a "Covering for…" Chip when viewing a non-assigned client.
 */
const EventSwitchButton = ({ userType }: { userType: string }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [csmInputValue, setCsmInputValue] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const open = Boolean(anchorEl);
  const { data: session } = useSession();
  const { events } = useEvents();
  const { currentClient, switchClient } = useClient();
  const { clients: allClients } = useClients();

  const isCsm = userType === "CSM";

  const assignedTickers = useMemo(() => {
    if (!isCsm) return null;
    const tickers = session?.user?.clientTickers;
    if (!tickers || tickers.length === 0) return null;
    return new Set(tickers.map((ticker) => ticker.toUpperCase()));
  }, [isCsm, session?.user?.clientTickers]);

  const isOnEventsPage = pathname === "/events";
  const isOnMeetingPage = /\/[^/]+\/(?:past-)?meeting\//.test(pathname);

  // Extract the ticker from the current URL (e.g. /BCSF/reporting → BCSF)
  const urlTicker = useMemo(() => {
    const match = /^\/([A-Z][^/]*)\//.exec(pathname);
    return match ? match[1] : null;
  }, [pathname]);

  // Deduplicate to one entry per client — prefer the most recent ACTIVE meeting,
  // then fall back to the most recent COMPLETE meeting.
  const clientOptions = useMemo(() => {
    const byTicker = new Map<string, EventRow>();

    for (const row of events) {
      const existing = byTicker.get(row.clientTicker);
      if (!existing) {
        byTicker.set(row.clientTicker, row);
        continue;
      }
      // Prefer ACTIVE over COMPLETE
      if (
        existing.meetingStatus !== "ACTIVE" &&
        row.meetingStatus === "ACTIVE"
      ) {
        byTicker.set(row.clientTicker, row);
        continue;
      }
      if (existing.meetingStatus === row.meetingStatus) {
        // Both same status — prefer the later date
        if (row.eventDate > existing.eventDate) {
          byTicker.set(row.clientTicker, row);
        }
      }
    }

    const all = [...byTicker.values()].sort((a, b) =>
      a.event.localeCompare(b.event)
    );
    // CSM: only show assigned clients in the list — the Autocomplete handles covering others
    if (isCsm && assignedTickers) {
      return all.filter((opt) =>
        assignedTickers.has(opt.clientTicker.toUpperCase())
      );
    }
    return all;
  }, [events, isCsm, assignedTickers]);

  // Try to match the current meeting from the URL path
  const currentEvent = useMemo(() => {
    if (!isOnMeetingPage) return null;
    const match = /\/([^/]+)\/(?:past-)?meeting\/([^/]+)/.exec(pathname);
    if (!match) return null;
    const [, matchedTicker, urlMeetingId] = match;
    return (
      events.find(
        (e) => e.clientTicker === matchedTicker && e.meetingId === urlMeetingId
      ) ?? null
    );
  }, [isOnMeetingPage, pathname, events]);

  // The "current" client is whichever the URL is showing — either a specific meeting
  // or a top-level client page like /BCSF/reporting or /BCSF/past-meetings.
  const currentClientOption = useMemo(() => {
    if (currentEvent) return currentEvent;
    if (!urlTicker) return null;
    return clientOptions.find((o) => o.clientTicker === urlTicker) ?? null;
  }, [currentEvent, urlTicker, clientOptions]);

  // Determine display name and whether dropdown is active
  const displayName = useMemo(() => {
    if (currentClientOption) return currentClientOption.event;
    if (isCsm && currentClient) {
      return (
        currentClient.company_name ??
        currentClient.short_name ??
        currentClient.ticker
      );
    }
    return USER_TYPE_BRAND_LABELS[userType] ?? "Select Client";
  }, [currentClientOption, userType, isCsm, currentClient]);

  const displayedClient = useMemo(() => {
    if (currentClientOption) {
      return {
        name: currentClientOption.event,
        ticker: currentClientOption.clientTicker,
      };
    }

    if (currentClient) {
      return {
        name:
          currentClient.short_name ??
          currentClient.company_name ??
          currentClient.ticker,
        ticker: currentClient.ticker,
      };
    }

    return null;
  }, [currentClientOption, currentClient]);

  // For CSM: show chip only when the URL ticker is not in their assigned client list.
  // Uses clientOptions (already filtered to assigned clients) as the source of truth
  // rather than assignedTickers directly, avoiding any case/format mismatch.
  const isCovering = useMemo(() => {
    if (!isCsm || !urlTicker || !assignedTickers) return false;
    return !clientOptions.some(
      (opt) => opt.clientTicker.toUpperCase() === urlTicker.toUpperCase()
    );
  }, [isCsm, urlTicker, assignedTickers, clientOptions]);

  // CSM needs the switcher on /events (backup client search); others show brand only there
  const hasDropdown = !isOnEventsPage || isCsm;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasDropdown) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCsmClientSelect = (client: Client | null) => {
    if (!client) return;
    setCsmInputValue("");
    handleClose();

    if (isOnEventsPage) {
      switchClient(client);
      return;
    }

    const matchingEvent = clientOptions.find(
      (row) => row.clientTicker === client.ticker
    );
    if (matchingEvent) {
      handleEventSelect(matchingEvent);
      return;
    }

    switchClient(client);
  };

  const handleEventSelect = (row: EventRow) => {
    const routePrefix =
      row.meetingStatus === "ACTIVE" ? "meeting" : "past-meeting";
    const meetingRoot = `/${row.clientTicker}/${routePrefix}/${row.meetingId}`;

    // Case 1: Currently on a meeting sub-page (/TICKER/(past-)meeting/ID/subpage).
    // Preserve the sub-page for the new client's meeting.
    const meetingMatch = /^\/[^/]+\/(?:past-)?meeting\/[^/]+(.*)$/.exec(
      pathname
    );
    if (meetingMatch) {
      const subPage = meetingMatch[1] ?? "";
      router.push(`${meetingRoot}${subPage}`);
      handleClose();
      return;
    }

    // Case 2: Currently on a top-level client page (/TICKER/reporting, /TICKER/past-meetings, etc.).
    // Navigate to the equivalent page for the new client so the user stays in context.
    const topLevelMatch = /^\/[A-Z][^/]*\/([^/]+)$/.exec(pathname);
    if (topLevelMatch) {
      router.push(`/${row.clientTicker}/${topLevelMatch[1]}`);
      handleClose();
      return;
    }

    // Default: navigate to the meeting dashboard for the selected client.
    router.push(meetingRoot);
    handleClose();
  };

  const coveringChip =
    isCovering && displayedClient ? (
      <Chip
        label={`Viewing ${displayedClient.name}`}
        color="warning"
        size="small"
        variant="outlined"
        sx={{ borderColor: "warning.light" }}
      />
    ) : null;

  if (!hasDropdown) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="button" sx={{ px: 1.375 }}>
          {displayName}
        </Typography>
        {coveringChip}
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Button
          tabIndex={0}
          variant="text"
          color="inherit"
          endIcon={<ArrowDropDownOutlined />}
          onClick={handleClick}
          sx={{
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {displayName}
        </Button>
        {coveringChip}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          list: {
            sx: {
              maxHeight: 300,
              overflowY: "auto",
            },
          },
          paper: {
            sx: {
              backgroundColor: (theme) =>
                theme.vars?.palette?.appSwitcher?.background ||
                theme.palette.primary.main,
              color: (theme) => theme.palette.common.white,
              minWidth: isCsm ? 280 : 200,
              overflow: isCsm ? "visible" : undefined,
            },
          },
        }}
        disableAutoFocusItem={isCsm}
      >
        {isCsm
          ? [
              ...(clientOptions.length > 0 ? [] : []),
              <MenuItem
                key="csm-search"
                disableRipple
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                sx={{
                  cursor: "default",
                  display: "block",
                  px: 1.5,
                  py: 1,
                  "&:hover": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                <Autocomplete<Client>
                  options={allClients.filter(
                    (c) => !assignedTickers?.has(c.ticker.toUpperCase())
                  )}
                  getOptionLabel={(option) =>
                    option.company_name ?? option.short_name ?? option.ticker
                  }
                  inputValue={csmInputValue}
                  onInputChange={(_, value) => setCsmInputValue(value)}
                  value={null}
                  onChange={(_, client) => handleCsmClientSelect(client)}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  size="small"
                  slotProps={{
                    popper: {
                      disablePortal: true,
                      placement: "bottom-start",
                    },
                    paper: {
                      sx: {
                        background: (theme) =>
                          theme.vars?.palette?.secondary?.main,
                        color: (theme) =>
                          theme.vars?.palette?.secondary?.contrastText,
                        "& .MuiAutocomplete-noOptions": {
                          color: (theme) =>
                            theme.vars?.palette?.appSwitcher?.contrastText,
                          fontSize: (theme) => theme.typography.body3.fontSize,
                        },
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Switch to another client..."
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      sx={(theme) => ({
                        "& .MuiInputBase-root": {
                          color: "inherit",
                          backgroundColor:
                            theme.vars.palette.appSwitcher?.background,
                          "& fieldset": {
                            borderColor: theme.vars.palette.grey[700],
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(255,255,255,0.5)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "rgba(255,255,255,0.8)",
                          },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "rgba(255,255,255,0.6)",
                          opacity: 1,
                        },
                        "& .MuiAutocomplete-endAdornment .MuiSvgIcon-root": {
                          color: "rgba(255,255,255,0.7)",
                        },
                      })}
                    />
                  )}
                />
              </MenuItem>,
            ]
          : null}
        {clientOptions.map((row) => (
          <MenuItem
            key={row.clientTicker}
            onClick={() => handleEventSelect(row)}
            selected={row.clientTicker === currentClientOption?.clientTicker}
            sx={{
              "&:hover": {
                backgroundColor: (theme) =>
                  theme.vars.palette.appSwitcher?.hover,
              },
              "&.Mui-selected": {
                backgroundColor: (theme) =>
                  theme.vars.palette.appSwitcher?.hover,
              },
            }}
          >
            {row.event}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const IssuerClientLabel = () => {
  const { currentClient, availableClients } = useClient();
  const { data: session } = useSession();

  const issuerTicker = session?.user?.client_ticker ?? undefined;
  const issuerClient =
    issuerTicker && currentClient?.ticker !== issuerTicker
      ? (availableClients.find((client) => client.ticker === issuerTicker) ??
        currentClient)
      : currentClient;

  const displayName =
    issuerClient?.company_name ??
    issuerClient?.short_name ??
    issuerTicker ??
    "Issuer Portal";

  return (
    <Typography
      component="span"
      variant="button"
      sx={(theme) => ({
        px: 1.375,
        color: theme.palette.appSwitcher.contrastText,
        display: "inline-block",
      })}
    >
      {displayName}
    </Typography>
  );
};

const SwitchButton = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { availableClients, currentClient, switchClient } = useClient();
  const { data: session } = useSession();
  const open = Boolean(anchorEl);

  const sessionUser = session?.user;
  const userType = sessionUser?.type;
  const isIssuer =
    isIssuerUser(sessionUser) ||
    (Boolean(sessionUser?.client_ticker) && availableClients.length <= 1);

  // Issuer logins are single-client; never show a client picker.
  if (isIssuer) {
    return <IssuerClientLabel />;
  }

  const isEventUser =
    userType === "PARENT_CLIENT" ||
    userType === "SOLICITOR" ||
    userType === "CSM";
  const canSwitchClients = canUserSwitchClients(sessionUser);

  // PARENT_CLIENT / SOLICITOR users get a special event-based switcher
  if (isEventUser && userType) {
    return (
      <Suspense
        fallback={
          <span style={{ padding: "6px 8px" }}>
            {USER_TYPE_BRAND_LABELS[userType] ?? "Loading..."}
          </span>
        }
      >
        <EventSwitchButton userType={userType} />
      </Suspense>
    );
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (canSwitchClients) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClientSelect = (client: Client) => {
    switchClient(client);
    handleClose();
  };

  const currentClientName =
    currentClient?.company_name ?? currentClient?.short_name ?? "Select Client";

  // If user doesn't have permission, just show the client name without dropdown
  if (!canSwitchClients) {
    return <span style={{ padding: "6px 8px" }}>{currentClientName}</span>;
  }

  return (
    <>
      <Button
        tabIndex={0}
        variant="text"
        color="inherit"
        endIcon={<ArrowDropDownOutlined />}
        onClick={handleClick}
        sx={{
          textTransform: "none",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {currentClientName}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: (theme) =>
                theme.vars?.palette?.appSwitcher?.background,
              color: (theme) => theme.palette.common.white,
              minWidth: 200,
            },
          },
        }}
      >
        {availableClients.map((client) => (
          <MenuItem
            key={client.id}
            onClick={() => handleClientSelect(client)}
            selected={client.id === currentClient?.id}
            sx={{
              "&:hover": {
                backgroundColor: (theme) =>
                  theme.vars.palette.appSwitcher?.hover,
              },
              "&.Mui-selected": {
                backgroundColor: (theme) =>
                  theme.vars.palette.appSwitcher?.hover,
              },
            }}
          >
            {client.company_name || client.short_name}
          </MenuItem>
        ))}
        {availableClients.length === 0 && (
          <MenuItem disabled>No clients available</MenuItem>
        )}
      </Menu>
    </>
  );
};

export const ClientAppSwitcher = () => {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        backgroundColor: theme.palette.appSwitcher.background,
        color: theme.palette.appSwitcher.contrastText,
      })}
    >
      <SwitchButton />
    </Box>
  );
};
