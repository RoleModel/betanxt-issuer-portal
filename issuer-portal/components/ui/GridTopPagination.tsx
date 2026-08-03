"use client";

import { Box, Pagination } from "@mui/material";

/**
 * Props for {@link GridTopPagination}.
 */
export interface GridTopPaginationProps {
  /** Total number of pages. */
  readonly count: number;
  /** Current page, 1-based (as MUI `Pagination` expects). */
  readonly page: number;
  /** Called with the newly selected 1-based page. */
  readonly onChange: (page: number) => void;
}

/**
 * Presentational pagination bar meant to sit directly above a MUI X data grid.
 *
 * It renders numbered page controls only; the caller wires `count`, `page`, and
 * `onChange` from the grid API. Keeping it free of grid hooks makes it reusable
 * across grids running different major versions of `@mui/x-data-grid` and
 * guarantees its counts match the grid footer, which reads the same state.
 */
export const GridTopPagination = ({
  count,
  page,
  onChange,
}: GridTopPaginationProps) => (
  <Box
    sx={{
      backgroundColor: "var(--mui-palette-dataGridHeaderRow-restingFill)",
      display: "flex",
      justifyContent: "flex-end",
      px: 1,
      py: 0.5,
    }}
  >
    <Pagination
      count={count}
      onChange={(event, value) => {
        onChange(value);
      }}
      page={page}
      shape="rounded"
      size="small"
    />
  </Box>
);

export default GridTopPagination;
