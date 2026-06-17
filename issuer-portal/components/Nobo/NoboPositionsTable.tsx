"use client";

import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { useMemo, useState } from "react";

import type { NoboPosition } from "@/hooks/useNoboPositions";

import NoWrapTableCell from "@/components/ui/NoWrapTableCell";
import SortableHeaderCell, { useSortableTable } from "@/components/ui/SortableHeaderCell";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";

interface NoboPositionsTableProps {
  /** NOBO positions to display; sorted and paginated client-side. */
  positions: NoboPosition[];
  /** Renders one page of skeleton rows while the positions fetch resolves. */
  loading?: boolean;
}

const COLUMN_COUNT = 4;

const formatNumber = (value: number): string => value.toLocaleString("en-US");

/**
 * Sortable, paginated table of non-objecting beneficial owner (NOBO)
 * positions: holder name, account number, shares, and state.
 *
 * Sorting is handled client-side via {@link useSortableTable}; pagination
 * defaults to 10 rows per page and resets to the first page when the page
 * size changes. Missing states render as an em dash, and an empty state row
 * is shown when no positions exist for the meeting.
 */
export function NoboPositionsTable({ positions, loading = false }: NoboPositionsTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { sortColumn, sortDirection, handleSort, sortData } = useSortableTable<NoboPosition>();

  const sortedPositions = useMemo(() => sortData(positions), [positions, sortData]);

  const paginatedPositions = sortedPositions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      <TableContainer>
        <Table sx={{ tableLayout: "auto" }}>
          <SROnlyTableCaption>NOBO Positions Table</SROnlyTableCaption>
          <TableHead>
            <TableRow>
              <SortableHeaderCell
                column="holderName"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Holder Name
              </SortableHeaderCell>
              <SortableHeaderCell
                column="accountNumber"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Account Number
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
                column="state"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                State
              </SortableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: COLUMN_COUNT }).map((_, columnIndex) => (
                    <NoWrapTableCell key={columnIndex}>
                      <Skeleton />
                    </NoWrapTableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} align="center">
                  <Box sx={{ py: 4, color: "text.secondary", typography: "body3" }}>
                    No NOBO positions found for this meeting
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPositions.map((position, index) => (
                <TableRow
                  key={position.id || `${position.accountNumber}-${index}`}
                  sx={{ "&:hover": { backgroundColor: "action.hover" } }}
                >
                  <NoWrapTableCell sx={{ width: 220 }}>{position.holderName}</NoWrapTableCell>
                  <NoWrapTableCell>{position.accountNumber}</NoWrapTableCell>
                  <NoWrapTableCell align="right">{formatNumber(position.shares)}</NoWrapTableCell>
                  <NoWrapTableCell>{position.state ?? "—"}</NoWrapTableCell>
                </TableRow>
              ))
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
          setRowsPerPage(Number.parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
}
