"use client";

import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import {
  Box,
  Collapse,
  Grid,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";

import type { TabulationPosition } from "@/hooks/useTabulationInsights";

import NoWrapTableCell from "../ui/NoWrapTableCell";
import SortableHeaderCell, { useSortableTable } from "../ui/SortableHeaderCell";
import SROnlyTableCaption from "../ui/SROnlyTableCaption";

interface PositionsTableProps {
  positions: TabulationPosition[];
  loading?: boolean;
}

export default function PositionsTable({ positions, loading = false }: PositionsTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { sortColumn, sortDirection, handleSort, sortData } =
    useSortableTable<TabulationPosition>();

  const sortedPositions = useMemo(() => sortData(positions), [positions, sortData]);

  const paginatedPositions = sortedPositions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const toggleRowExpansion = (index: number) => {
    const nextExpanded = new Set(expandedRows);

    if (nextExpanded.has(index)) {
      nextExpanded.delete(index);
    } else {
      nextExpanded.add(index);
    }

    setExpandedRows(nextExpanded);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
  };

  const formatAccountType = (accountType: string): string => {
    if (accountType === "DTC/CDS") {
      return "CEDE & CO / CDS & CO";
    }
    if (accountType === "Non-DTC") {
      return "Registered Account";
    }
    return accountType;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "";

    try {
      const sanitizedDate = date.includes(" 12:00AM") ? date.replace(" 12:00AM", "") : date;
      const parsedDate = new Date(sanitizedDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return "";
      }

      return parsedDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch (_error) {
      return "";
    }
  };

  return (
    <Box>
      <TableContainer>
        <Table sx={{ tableLayout: "auto" }}>
          <SROnlyTableCaption>Positions Table</SROnlyTableCaption>
          <TableHead>
            <TableRow>
              <SortableHeaderCell
                column="cusip"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                CUSIP
              </SortableHeaderCell>
              <SortableHeaderCell
                column="accountType"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Account Type
              </SortableHeaderCell>
              <SortableHeaderCell
                column="setKey"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Set Key
              </SortableHeaderCell>
              <SortableHeaderCell
                column="name"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Name
              </SortableHeaderCell>
              <SortableHeaderCell
                column="accountNumber"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Account #
              </SortableHeaderCell>
              <SortableHeaderCell
                column="voteStatus"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Vote Status
              </SortableHeaderCell>
              <SortableHeaderCell
                column="shares"
                align="right"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Shares
              </SortableHeaderCell>
              <SortableHeaderCell
                column="sharesVoted"
                align="right"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Shares Voted
              </SortableHeaderCell>
              <SortableHeaderCell
                column="source"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Source
              </SortableHeaderCell>
              <SortableHeaderCell
                column="dateVoted"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Date Voted
              </SortableHeaderCell>
              <SortableHeaderCell
                column="sentBy"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Sent By
              </SortableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 11 }).map((_, columnIndex) => (
                    <NoWrapTableCell key={columnIndex}>
                      <Skeleton />
                    </NoWrapTableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography variant="body3" color="text.secondary" sx={{ py: 4 }}>
                    No positions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPositions.map((position, index) => {
                const rowKey = page * rowsPerPage + index;
                const isExpanded = expandedRows.has(rowKey);

                return (
                  <React.Fragment key={`${position.accountNumber}-${rowKey}`}>
                    <TableRow sx={{ "&:hover": { backgroundColor: "action.hover" } }}>
                      <NoWrapTableCell>{position.cusip}</NoWrapTableCell>
                      <NoWrapTableCell>{formatAccountType(position.accountType)}</NoWrapTableCell>
                      <NoWrapTableCell>{position.setKey}</NoWrapTableCell>
                      <NoWrapTableCell sx={{ width: 180 }}>{position.name}</NoWrapTableCell>
                      <TableCell
                        onClick={() => toggleRowExpansion(rowKey)}
                        sx={{ cursor: "pointer", minWidth: 220 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <IconButton aria-label="expand row" size="small" color="primary">
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                          <Box
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "primary.main",
                            }}
                          >
                            {position.accountNumber}
                          </Box>
                        </Box>
                      </TableCell>
                      <NoWrapTableCell>{position.voteStatus}</NoWrapTableCell>
                      <NoWrapTableCell align="right">
                        {formatNumber(position.shares)}
                      </NoWrapTableCell>
                      <NoWrapTableCell align="right">
                        {formatNumber(position.sharesVoted)}
                      </NoWrapTableCell>
                      <NoWrapTableCell>{position.source}</NoWrapTableCell>
                      <NoWrapTableCell>{formatDate(position.dateVoted)}</NoWrapTableCell>
                      <TableCell align="right">
                        {position.sentBy ? (
                          <MailOutlineIcon fontSize="small" />
                        ) : (
                          <InsertDriveFileOutlinedIcon fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell sx={{ pb: 0, pt: 0 }} colSpan={11}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                my: 2,
                                mx: 2,
                                p: 3,
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                backgroundColor: "var(--mui-palette-Datagrid-defaultFill)",
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    CUSIP:
                                  </Typography>
                                  <Typography variant="body2">{position.cusip}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Account Name:
                                  </Typography>
                                  <Typography variant="body2">{position.name}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Set Key:
                                  </Typography>
                                  <Typography variant="body2">{position.setKey}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Account Number:
                                  </Typography>
                                  <Typography variant="body2">{position.accountNumber}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Account Type:
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatAccountType(position.accountType)}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Account Email:
                                  </Typography>
                                  <Typography variant="body2">
                                    {position.accountEmail || ""}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Control Number:
                                  </Typography>
                                  <Typography variant="body2">{position.controlNumber}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Last Vote Method:
                                  </Typography>
                                  <Typography variant="body2">{position.source || ""}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Last Voted Date:
                                  </Typography>
                                  <Typography variant="body2">
                                    {formatDate(position.dateVoted)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedPositions.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 25));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
}
