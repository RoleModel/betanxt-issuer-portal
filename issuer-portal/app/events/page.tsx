/* eslint-disable react-doctor/js-tosorted-immutable */
"use client";

import { Add } from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { NewClientDrawer } from "@/components/Clients/NewClientDrawer";
import { EventsDataGrid } from "@/components/Events/EventsDataGrid";
import { useEvents } from "@/hooks/useEvents";

const EventsPage = () => {
  const { data: session } = useSession();
  const { events, loading, error, revalidate, applyTabulationReleased } =
    useEvents();
  const [newClientOpen, setNewClientOpen] = useState(false);

  const userType = session?.user.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";
  const tickers = session?.user.clientTickers;
  const assignedTickersKey =
    !isCSM || tickers === undefined
      ? "all-clients"
      : [...tickers].sort().join("|");
  const assignedTickers =
    !isCSM || tickers === undefined || tickers.length === 0
      ? null
      : new Set(tickers.map((ticker) => ticker.toUpperCase()));
  const activeEvents = events.filter(
    (event) => event.meetingStatus === "ACTIVE"
  );

  const clientCount = new Set(activeEvents.map((event) => event.clientTicker))
    .size;
  const emptyMessage = "No upcoming events found.";

  return (
    <Container
      maxWidth="xl"
      data-testid="events-page"
      sx={{ p: { xs: 2, sm: 3 } }}
    >
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
          {/* No max height: the grid uses `autoHeight`, so it sizes itself to
              the page's rows and never scrolls internally. Any cap here clips
              the rows past it instead — a full page of 25 needs ~1456px. */}
          <Box sx={{ display: "flex", width: "100%" }}>
            <EventsDataGrid
              assignedTickers={assignedTickers}
              assignedTickersKey={assignedTickersKey}
              canReleaseTabulation={isCSM}
              emptyMessage={emptyMessage}
              events={events}
              loading={loading}
              onRefresh={() => {
                void revalidate();
              }}
              onTabulationReleased={applyTabulationReleased}
            />
          </Box>
        </CardContent>
      </Card>

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
