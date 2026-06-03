"use client";

import { Edit } from "@mui/icons-material";
import { SearchOutlined } from "@mui/icons-material";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import React, { useMemo, useState } from "react";

import type { EventRow } from "@/utils/eventData";

import { useEvents } from "@/hooks/useEvents";
import { getMeetingUrl } from "@/utils/eventData";

type Order = "asc" | "desc";
type OrderBy = keyof EventRow;

function parseEventDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split("/");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

function formatDate(dateStr: string): string {
  const date = parseEventDate(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export default function EventsPage() {
  const { data: session } = useSession();
  const { events, loading } = useEvents();
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("eventDate");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllClients, setShowAllClients] = useState(false);

  const userType = session?.user?.type ?? "PARENT_CLIENT";
  const isCSM = userType === "CSM";
  // Assigned tickers for this CSM — undefined means no restriction
  const assignedTickers = useMemo<Set<string> | null>(() => {
    if (!isCSM) return null;
    const tickers = session?.user?.clientTickers;
    if (!tickers || tickers.length === 0) return null;
    return new Set(tickers.map((t) => t.toUpperCase()));
  }, [isCSM, session?.user?.clientTickers]);

  // When the search is non-empty the filter is automatically expanded to all clients
  const isSearching = searchQuery.trim().length > 0;
  const isFiltered = isCSM && !!assignedTickers && !showAllClients && !isSearching;

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    // CSM: restrict to assigned clients unless searching or expanded
    if (isFiltered && assignedTickers) {
      filtered = filtered.filter((row) => assignedTickers.has(row.clientTicker.toUpperCase()));
    }

    // Events page only lists upcoming/active meetings. Completed meetings live in Past Events.
    filtered = filtered.filter((row) => row.meetingStatus === "ACTIVE");

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.event.toLowerCase().includes(query) ||
          row.cusip.toLowerCase().includes(query) ||
          row.eventType.toLowerCase().includes(query) ||
          row.eventDate.includes(query) ||
          row.clientTicker.toLowerCase().includes(query),
      );
    }

    return [...filtered].sort((a, b) => {
      let compareA: string | number | null | undefined = a[orderBy];
      let compareB: string | number | null | undefined = b[orderBy];

      if (orderBy === "eventDate") {
        compareA = parseEventDate(a.eventDate).getTime();
        compareB = parseEventDate(b.eventDate).getTime();
      }

      if (typeof compareA === "number" && typeof compareB === "number") {
        return order === "asc" ? compareA - compareB : compareB - compareA;
      }

      if (typeof compareA === "string" && typeof compareB === "string") {
        return order === "asc"
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      }

      return 0;
    });
  }, [events, searchQuery, order, orderBy, isFiltered, assignedTickers]);

  const paginatedEvents = useMemo(
    () => filteredAndSortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredAndSortedEvents, page, rowsPerPage],
  );

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const totalPages = Math.ceil(filteredAndSortedEvents.length / rowsPerPage);

  return (
    <Container maxWidth="lg" data-testid="events-page" sx={{ p: { xs: 2, sm: 3 } }}>
      <Card>
        <CardHeader
          title={"Events"}
          action={
            <Stack direction="row" alignItems="center" spacing={1}>
              {isCSM && assignedTickers && (
                <Tooltip
                  title={
                    isFiltered
                      ? `Showing your ${assignedTickers.size} assigned client${assignedTickers.size === 1 ? "" : "s"}. Search or click to see all.`
                      : isSearching
                        ? "Searching all clients"
                        : "Showing all clients"
                  }
                >
                  <Chip
                    label={isFiltered ? `My clients (${assignedTickers.size})` : "All clients"}
                    size="small"
                    color={isFiltered ? "primary" : "default"}
                    variant={isFiltered ? "filled" : "outlined"}
                    onClick={() => {
                      setShowAllClients((v) => !v);
                      setPage(0);
                    }}
                    onDelete={
                      isFiltered
                        ? () => {
                            setShowAllClients(true);
                            setPage(0);
                          }
                        : undefined
                    }
                    sx={{ cursor: "pointer" }}
                  />
                </Tooltip>
              )}
              <TextField
                size="small"
                placeholder={isCSM && assignedTickers ? "Search all clients…" : "Search"}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ minWidth: 220 }}
              />
            </Stack>
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "event"}
                      direction={orderBy === "event" ? order : "asc"}
                      onClick={() => handleRequestSort("event")}
                    >
                      Event
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "cusip"}
                      direction={orderBy === "cusip" ? order : "asc"}
                      onClick={() => handleRequestSort("cusip")}
                    >
                      CUSIP
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "eventDate"}
                      direction={orderBy === "eventDate" ? order : "asc"}
                      onClick={() => handleRequestSort("eventDate")}
                    >
                      Event Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "eventType"}
                      direction={orderBy === "eventType" ? order : "asc"}
                      onClick={() => handleRequestSort("eventType")}
                    >
                      Event Type
                    </TableSortLabel>
                  </TableCell>
                  {isCSM && <TableCell align="right">Edit</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isCSM ? 5 : 4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {paginatedEvents.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Link
                            component={NextLink}
                            href={getMeetingUrl(row)}
                            underline="hover"
                            color="primary"
                            sx={{
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              display: "block",
                            }}
                          >
                            {row.event}
                          </Link>
                        </TableCell>
                        <TableCell>{row.cusip}</TableCell>
                        <TableCell>{formatDate(row.eventDate)}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{row.eventType}</TableCell>
                        {isCSM && (
                          <TableCell align="right">
                            <IconButton
                              component={NextLink}
                              href={`/edit/${row.id}`}
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {paginatedEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isCSM ? 5 : 4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchQuery
                              ? "No events match your search."
                              : isFiltered
                                ? "No upcoming events for your assigned clients."
                                : "No upcoming events found."}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    count={filteredAndSortedEvents.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} of ${count} (${totalPages} pages)`
                    }
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
}
