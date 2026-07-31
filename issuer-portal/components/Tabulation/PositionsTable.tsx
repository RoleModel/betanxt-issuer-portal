"use client";

import type { GridColDef } from "@mui/x-data-grid";

import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { Box, Tooltip } from "@mui/material";
import {
  DataGrid,
  gridFilteredSortedRowIdsSelector,
  useGridApiRef,
} from "@mui/x-data-grid";
import { useEffect, useState } from "react";

import type { TabulationPosition } from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import { exportPositionsToPdf } from "@/utils/exportPositionsPdf";
import {
  dateFilterOperators,
  getDistinctStringValues,
  numericFilterOperators,
  singleSelectFilterOperators,
  textFilterOperators,
} from "@/utils/tabulation-grid-filter-operators";
import { formatTabulationMetric } from "@/utils/tabulation-display";

interface PositionsTableProps {
  readonly positions: readonly TabulationPosition[];
  readonly loading?: boolean;
  readonly meetingTitle?: string;
  readonly clientTicker?: string;
}

const formatAccountType = (accountType: string): string => {
  if (accountType === "DTC/CDS") {
    return "CEDE & CO / CDS & CO";
  }

  if (accountType === "Non-DTC") {
    return "Registered Account";
  }

  return accountType;
};

const parseDate = (date: string | null): Date | null => {
  if (date === null || date.length === 0) return null;

  const sanitizedDate = date.includes(" 12:00AM")
    ? date.replace(" 12:00AM", "")
    : date;
  const parsedDate = new Date(sanitizedDate);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatDate = (date: Date | null): string => {
  if (date === null) return "";

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const staticColumns: GridColDef<TabulationPosition>[] = [
  {
    field: "cusip",
    filterOperators: textFilterOperators,
    headerName: "CUSIP",
    minWidth: 120,
  },
  {
    field: "accountType",
    filterOperators: singleSelectFilterOperators,
    headerName: "Account Type",
    minWidth: 190,
    type: "singleSelect",
    valueFormatter: (value: string) => formatAccountType(value),
  },
  {
    field: "setKey",
    filterOperators: singleSelectFilterOperators,
    headerName: "Set Key",
    minWidth: 120,
    type: "singleSelect",
  },
  {
    field: "name",
    filterOperators: textFilterOperators,
    flex: 1,
    headerName: "Name",
    minWidth: 180,
  },
  {
    field: "accountNumber",
    filterOperators: textFilterOperators,
    headerName: "Account #",
    minWidth: 220,
  },
  {
    field: "controlNumber",
    filterOperators: textFilterOperators,
    headerName: "Control #",
    minWidth: 180,
  },
  {
    field: "voteStatus",
    filterOperators: singleSelectFilterOperators,
    headerName: "Vote Status",
    minWidth: 130,
    type: "singleSelect",
  },
  {
    field: "source",
    filterOperators: singleSelectFilterOperators,
    headerName: "Source",
    minWidth: 110,
    type: "singleSelect",
  },
  {
    field: "dateVoted",
    filterOperators: dateFilterOperators,
    headerName: "Date Voted",
    minWidth: 130,
    type: "date",
    valueFormatter: (value: Date | null) => formatDate(value),
    valueGetter: (value: string | null) => parseDate(value),
  },
  {
    field: "sentBy",
    filterOperators: textFilterOperators,
    headerName: "Sent By",
    minWidth: 110,
    align: "center",
    headerAlign: "center",
    renderCell: ({ value }) => {
      const wasSent = typeof value === "string" && value.length > 0;
      const label = wasSent ? value : "Not sent";

      return (
        <Tooltip title={label}>
          <Box
            aria-label={label}
            component="span"
            sx={{ alignItems: "center", display: "inline-flex" }}
          >
            {wasSent ? (
              <MailOutlineIcon fontSize="small" />
            ) : (
              <InsertDriveFileOutlinedIcon fontSize="small" />
            )}
          </Box>
        </Tooltip>
      );
    },
  },
  {
    field: "accountEmail",
    filterOperators: textFilterOperators,
    headerName: "Account Email",
    minWidth: 220,
  },
  {
    field: "state",
    filterOperators: singleSelectFilterOperators,
    headerName: "State",
    minWidth: 90,
    type: "singleSelect",
  },
  {
    field: "country",
    filterOperators: singleSelectFilterOperators,
    headerName: "Country",
    minWidth: 110,
    type: "singleSelect",
  },
];

const PositionsTable = ({
  positions,
  loading = false,
  meetingTitle = "Meeting Positions",
  clientTicker,
}: PositionsTableProps) => {
  const { displayMode } = useTabulationDisplay();
  const apiRef = useGridApiRef();
  const [isExporting, setIsExporting] = useState(false);
  const totalShares = positions.reduce(
    (total, position) => total + position.shares,
    0
  );
  const categoricalValueOptions: Readonly<
    Partial<Record<string, readonly string[]>>
  > = {
    country: getDistinctStringValues(positions, (position) => position.country),
    setKey: getDistinctStringValues(positions, (position) => position.setKey),
    source: getDistinctStringValues(positions, (position) => position.source),
    state: getDistinctStringValues(positions, (position) => position.state),
    voteStatus: getDistinctStringValues(
      positions,
      (position) => position.voteStatus
    ),
  };
  const configuredStaticColumns = staticColumns.map((column) => {
    if (column.field === "accountType") {
      return {
        ...column,
        valueOptions: getDistinctStringValues(
          positions,
          (position) => position.accountType
        ).map((value) => ({ label: formatAccountType(value), value })),
      };
    }

    const valueOptions = categoricalValueOptions[column.field];
    return valueOptions === undefined ? column : { ...column, valueOptions };
  });
  const columns: GridColDef<TabulationPosition>[] = [
    ...configuredStaticColumns.slice(0, 7),
    {
      field: "shares",
      filterOperators: numericFilterOperators,
      headerAlign: "right",
      headerName: "Shares",
      minWidth: 130,
      type: "number",
      valueGetter: (value, row) => {
        void value;
        if (displayMode === "numbers") return row.shares;
        return totalShares > 0 ? (row.shares / totalShares) * 100 : 0;
      },
      renderCell: (parameters) => {
        const metric = formatTabulationMetric(
          parameters.row.shares,
          totalShares,
          displayMode
        );
        return (
          <Tooltip title={metric.alternate}>
            <span>{metric.display}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "sharesVoted",
      filterOperators: numericFilterOperators,
      headerAlign: "right",
      headerName: "Shares Voted",
      minWidth: 150,
      type: "number",
      valueGetter: (value, row) => {
        void value;
        if (displayMode === "numbers") return row.sharesVoted;
        return totalShares > 0 ? (row.sharesVoted / totalShares) * 100 : 0;
      },
      renderCell: (parameters) => {
        const metric = formatTabulationMetric(
          parameters.row.sharesVoted,
          totalShares,
          displayMode
        );
        return (
          <Tooltip title={metric.alternate}>
            <span>{metric.display}</span>
          </Tooltip>
        );
      },
    },
    ...configuredStaticColumns.slice(7),
  ];

  useEffect(() => {
    const gridApi = apiRef.current;
    if (gridApi === null) return undefined;

    const originalExportDataAsCsv = gridApi.exportDataAsCsv;
    const exportPdf = async () => {
      if (isExporting) return;

      setIsExporting(true);

      try {
        const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
        const exportRows = filteredSortedRowIds
          .map((rowId) => gridApi.getRow(rowId))
          .filter(
            (row): row is TabulationPosition =>
              row !== null && row !== undefined
          );

        await exportPositionsToPdf({
          clientTicker,
          meetingTitle,
          positions: exportRows,
        });
      } catch {
        setIsExporting(false);
        return;
      }

      setIsExporting(false);
    };

    gridApi.exportDataAsCsv = () => {
      void exportPdf();
    };

    return () => {
      gridApi.exportDataAsCsv = originalExportDataAsCsv;
    };
  }, [apiRef, clientTicker, isExporting, meetingTitle]);

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        apiRef={apiRef}
        autoHeight
        columns={columns}
        rows={positions}
        loading={loading}
        showToolbar
        disableRowSelectionOnClick
        initialState={{
          columns: {
            columnVisibilityModel: {
              accountEmail: false,
              country: false,
              state: false,
            },
          },
          pagination: {
            paginationModel: {
              page: 0,
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        slotProps={{
          toolbar: {
            csvOptions: {
              disableToolbarButton: isExporting,
            },
            printOptions: {
              disableToolbarButton: true,
            },
            quickFilterProps: {
              debounceMs: 300,
            },
          },
        }}
        localeText={{
          toolbarExportCSV: "Export PDF",
        }}
        sx={{
          border: 0,
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
            outline: "none",
          },
        }}
      />
    </Box>
  );
};

export default PositionsTable;
