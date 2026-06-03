"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TablePaginationActions,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import React from "react";

import SkeletonTable from "@/components/ui/SkeletonTable";

interface ProposalPerformanceData {
  type: string;
  totalPresented: string;
  averageSupport: string;
  min: string;
  max: string;
  percentPassed: string;
}

interface ProposalPerformanceTableProps {
  data: ProposalPerformanceData[];
  loading?: boolean;
}

type Order = "asc" | "desc";
type OrderBy = keyof ProposalPerformanceData;

const ProposalPerformanceTable: React.FC<ProposalPerformanceTableProps> = ({
  data,
  loading = false,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [order, setOrder] = React.useState<Order>("desc");
  const [orderBy, setOrderBy] = React.useState<OrderBy>("totalPresented");

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedData = React.useMemo(() => {
    if (loading || !data) return [];
    return [...data].sort((a, b) => {
      let aValue: string | number = a[orderBy];
      let bValue: string | number = b[orderBy];

      // Handle numeric sorting for values with % or numbers
      if (["totalPresented", "averageSupport", "min", "max", "percentPassed"].includes(orderBy)) {
        aValue = parseInt(aValue.replace("%", ""));
        bValue = parseInt(bValue.replace("%", ""));
      }

      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, order, orderBy, loading]);

  if (loading) {
    return <SkeletonTable rows={5} columns={6} />;
  }

  return (
    <Card>
      <CardHeader title="Proposal Performance" />
      <CardContent>
        <TableContainer>
          <Table sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "type"}
                    direction={orderBy === "type" ? order : "asc"}
                    onClick={() => handleRequestSort("type")}
                  >
                    Proposal Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "totalPresented"}
                    direction={orderBy === "totalPresented" ? order : "asc"}
                    onClick={() => handleRequestSort("totalPresented")}
                  >
                    Total Presented
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "averageSupport"}
                    direction={orderBy === "averageSupport" ? order : "asc"}
                    onClick={() => handleRequestSort("averageSupport")}
                  >
                    Average Support
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "min"}
                    direction={orderBy === "min" ? order : "asc"}
                    onClick={() => handleRequestSort("min")}
                  >
                    Min
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "max"}
                    direction={orderBy === "max" ? order : "asc"}
                    onClick={() => handleRequestSort("max")}
                  >
                    Max
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "percentPassed"}
                    direction={orderBy === "percentPassed" ? order : "asc"}
                    onClick={() => handleRequestSort("percentPassed")}
                  >
                    Percent Passed
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : sortedData
              ).map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.totalPresented}</TableCell>
                  <TableCell>{row.averageSupport}</TableCell>
                  <TableCell>{row.min}</TableCell>
                  <TableCell>{row.max}</TableCell>
                  <TableCell>{row.percentPassed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={6}
                  count={sortedData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{
                    select: {
                      inputProps: {
                        "aria-label": "rows per page",
                      },
                      native: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ProposalPerformanceTable;
