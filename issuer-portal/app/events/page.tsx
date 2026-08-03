/* eslint-disable react-doctor/js-tosorted-immutable */
"use client";

import { Add } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useState } from "react";

import type { components } from "@/domain-models/generated-schema";
import type { EventRow } from "@/utils/eventData";

import { NewClientDrawer } from "@/components/Clients/NewClientDrawer";
import { EventsDataGrid } from "@/components/Events/EventsDataGrid";
import { buildApiClient } from "@/domain-models/apiClient";
import { useEvents } from "@/hooks/use-events";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { asRecord } from "@/utils/typeUtils";

type TabulationReview = components["schemas"]["TabulationReview"];

const NeedsReviewLabel = "Needs review";
const VerifiedLabel = "Verified";

const EventsPage = () => {
  const { data: session } = useSession();
  const { events, loading, error, revalidate } = useEvents();
  const { flags } = useFeatureFlags();
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [statusMenu, setStatusMenu] = useState<{
    anchor: HTMLElement;
    row: EventRow;
  } | null>(null);

  const userType = session?.user?.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";
  const tickers = session?.user?.clientTickers;
  const assignedTickersKey =
    !isCSM || tickers === undefined ? "all-clients" : [...tickers].sort().join("|");
  const assignedTickers =
    !isCSM || tickers === undefined || tickers.length === 0
      ? null
      : new Set(tickers.map((ticker) => ticker.toUpperCase()));
  const activeEvents = events.filter((event) => event.meetingStatus === "ACTIVE");

  const clientCount = new Set(activeEvents.map((event) => event.clientTicker)).size;
  const emptyMessage = "No upcoming events found.";
  const showReviewColumn = isCSM && flags.enableCsmTabulationApproval;

  const handleSetReportStatus = async (
    row: EventRow,
    status: "PENDING_REVIEW" | "VERIFIED",
  ): Promise<void> => {
    setStatusMenu(null);
    const api = await buildApiClient();
    const { data } = await api.GET("/meetings/{meetingId}", {
      params: { path: { meetingId: row.meetingId } },
    });
    const existing = (asRecord(asRecord(data)?.tabulationReview) ?? {}) as TabulationReview;
    const reviewer = session?.user?.name ?? session?.user?.username ?? "CSM";

    await api.PUT("/meetings/{meetingId}", {
      body: {
        tabulationReview: {
          ...existing,
          reviewedAt: status === "VERIFIED" ? new Date().toISOString() : null,
          reviewedBy: status === "VERIFIED" ? reviewer : null,
          status,
        },
      },
      params: { path: { meetingId: row.meetingId } },
    });
    void revalidate();
  };

  return (
    <Container
      maxWidth="xl"
      data-testid="events-page"
      sx={{ display: "grid", gap: 3, p: { xs: 2, sm: 3 } }}
    >
      {isCSM && showReviewColumn ? (
        <Alert
          action={
            <Button color="inherit" component="a" href="/tabulation-review" size="small">
              Review Reports
            </Button>
          }
          severity="warning"
          variant="filled"
          sx={{
            "--mui-palette-Alert-warningFilledColor": (theme) => theme.palette.primary.contrastText,
            "--mui-palette-Alert-warningFilledBg": (theme) => theme.palette.primary.main,
            ".MuiButton-contained": {
              color: (theme) => theme.palette.primary.main,
            },
          }}
        >
          <AlertTitle>Tabulation Review</AlertTitle>
          There are {activeEvents.filter((event) => event.reportStatus !== "VERIFIED").length}{" "}
          events with tabulation reports that need review.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Events"
          subheader={`${clientCount} clients · ${activeEvents.length} upcoming events`}
          action={
            isCSM ? (
              <IconButton
                aria-label="Add client"
                onClick={() => {
                  setNewClientOpen(true);
                }}
              >
                <Add />
              </IconButton>
            ) : undefined
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {error !== null && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: "flex", maxHeight: 1280, width: "100%" }}>
            <EventsDataGrid
              assignedTickers={assignedTickers}
              assignedTickersKey={assignedTickersKey}
              emptyMessage={emptyMessage}
              events={events}
              loading={loading}
              onEditReportStatus={(row, anchor) => {
                setStatusMenu({ anchor, row });
              }}
              showReviewColumn={showReviewColumn}
            />
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={statusMenu?.anchor}
        onClose={() => {
          setStatusMenu(null);
        }}
        open={Boolean(statusMenu)}
      >
        <MenuItem
          onClick={() => {
            if (statusMenu) {
              void handleSetReportStatus(statusMenu.row, "PENDING_REVIEW");
            }
          }}
        >
          {NeedsReviewLabel}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (statusMenu) {
              void handleSetReportStatus(statusMenu.row, "VERIFIED");
            }
          }}
        >
          {VerifiedLabel}
        </MenuItem>
      </Menu>

      <NewClientDrawer
        open={newClientOpen}
        onClose={() => {
          setNewClientOpen(false);
        }}
        onCreated={() => {
          void revalidate();
          setNewClientOpen(false);
        }}
      />
    </Container>
  );
};

export default EventsPage;
