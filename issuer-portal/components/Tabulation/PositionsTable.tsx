"use client";

import type {
  GridColDef,
  GridColSpanFn,
  GridRenderCellParams,
  GridRowHeightParams,
} from "@mui/x-data-grid";
import type { ReactNode } from "react";

import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import {
  Box,
  Grid,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  gridFilteredSortedRowIdsSelector,
  useGridApiRef,
} from "@mui/x-data-grid";
import { useState } from "react";

import type { TabulationPosition } from "@/hooks/useTabulationInsights";

import { useTabulationDisplay } from "@/contexts/TabulationDisplayContext";
import { exportPositionsToPdf } from "@/utils/exportPositionsPdf";
import { exportPositionsToXlsx } from "@/utils/exportPositionsXlsx";
import { formatTabulationMetric } from "@/utils/tabulation-display";
import {
  dateFilterOperators,
  getDistinctStringValues,
  numericFilterOperators,
  singleSelectFilterOperators,
  textFilterOperators,
} from "@/utils/tabulation-grid-filter-operators";

// The built-in v8 grid toolbar accepts `additionalExportMenuItems`, but the
// public slot-props type still points at the legacy toolbar props, so it has to
// be declared here to pass it through `slotProps.toolbar` type-safely.
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    readonly additionalExportMenuItems?: (
      onMenuItemClick: () => void
    ) => ReactNode;
  }
}

interface PositionsTableProps {
  readonly positions: readonly TabulationPosition[];
  readonly loading?: boolean;
  readonly meetingTitle?: string;
  readonly clientTicker?: string;
}

interface PositionGridRow extends TabulationPosition {
  readonly positionId: string;
  readonly rowType: "account" | "details";
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
    timeZone: "UTC",
  });
};

const PositionDetailField = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Typography color="text.secondary" variant="body3">
      {label}
    </Typography>
    <Typography variant="body3">{value}</Typography>
  </Grid>
);

const PositionDetailsRow = ({
  position,
}: {
  readonly position: PositionGridRow;
}) => (
  <Box
    sx={{
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
      m: 1,
      p: 2,
    }}
  >
    <Grid container spacing={2}>
      <PositionDetailField label="CUSIP:" value={position.cusip} />
      <PositionDetailField label="Account Name:" value={position.name} />
      <PositionDetailField label="Set Key:" value={position.setKey} />
      <PositionDetailField
        label="Account Number:"
        value={position.accountNumber}
      />
      <PositionDetailField
        label="Account Type:"
        value={formatAccountType(position.accountType)}
      />
      <PositionDetailField
        label="Account Email:"
        value={position.accountEmail ?? ""}
      />
      <PositionDetailField
        label="Control Number:"
        value={position.controlNumber}
      />
      <PositionDetailField label="Last Vote Method:" value={position.source} />
      <PositionDetailField
        label="Last Voted Date:"
        value={formatDate(parseDate(position.dateVoted))}
      />
    </Grid>
  </Box>
);

const AccountNumberCell = ({
  accountNumber,
  expanded,
  onToggle,
}: {
  readonly accountNumber: string;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) => (
  <Box
    sx={{
      alignItems: "center",
      display: "flex",
      gap: 1,
      width: "100%",
      height: "100%",
    }}
  >
    <IconButton
      aria-expanded={expanded}
      aria-label={`${expanded ? "Collapse" : "Expand"} account ${accountNumber}`}
      onClick={onToggle}
      size="small"
    >
      {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
    </IconButton>
    <Typography color="primary" noWrap variant="body3">
      {accountNumber}
    </Typography>
  </Box>
);

const getPositionRowHeight = ({ model }: GridRowHeightParams): number | null =>
  (model as PositionGridRow).rowType === "details" ? 232 : null;

const getPositionDetailColSpan =
  (totalColumnCount: number): GridColSpanFn<PositionGridRow> =>
  (value, row) => {
    void value;
    return row.rowType === "details" ? totalColumnCount : 1;
  };

const staticColumns: GridColDef<PositionGridRow>[] = [
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
  const [expandedPositionIds, setExpandedPositionIds] = useState<Set<string>>(
    new Set()
  );
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
  const totalColumnCount = staticColumns.length + 2;
  const togglePositionExpansion = (positionId: string): void => {
    setExpandedPositionIds((currentPositionIds) => {
      const nextPositionIds = new Set(currentPositionIds);

      if (nextPositionIds.has(positionId)) {
        nextPositionIds.delete(positionId);
      } else {
        nextPositionIds.add(positionId);
      }

      return nextPositionIds;
    });
  };
  const configuredStaticColumns = staticColumns.map((column) => {
    if (column.field === "cusip") {
      return {
        ...column,
        colSpan: getPositionDetailColSpan(totalColumnCount),
        renderCell: (parameters: GridRenderCellParams<PositionGridRow>) => {
          if (parameters.row.rowType === "details") {
            return <PositionDetailsRow position={parameters.row} />;
          }

          return parameters.formattedValue ?? parameters.value;
        },
      };
    }

    if (column.field === "accountNumber") {
      return {
        ...column,
        renderCell: (parameters: GridRenderCellParams<PositionGridRow>) => {
          if (parameters.row.rowType === "details") return null;

          return (
            <AccountNumberCell
              accountNumber={parameters.row.accountNumber}
              expanded={expandedPositionIds.has(parameters.row.positionId)}
              onToggle={() => {
                togglePositionExpansion(parameters.row.positionId);
              }}
            />
          );
        },
      };
    }

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
  const columns: GridColDef<PositionGridRow>[] = [
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
        if (parameters.row.rowType === "details") return null;

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
        if (parameters.row.rowType === "details") return null;

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
  const gridRows = positions.flatMap<PositionGridRow>((position) => {
    const accountRow: PositionGridRow = {
      ...position,
      positionId: position.id,
      rowType: "account",
    };

    if (!expandedPositionIds.has(position.id)) {
      return [accountRow];
    }

    return [
      accountRow,
      {
        ...position,
        id: `${position.id}-details`,
        positionId: position.id,
        rowType: "details",
      },
    ];
  });

  // Exports mirror what the user currently sees: filtered and sorted as in the
  // grid, with the synthetic "details" rows and their helper fields removed.
  const collectExportPositions = (): TabulationPosition[] => {
    const gridApi = apiRef.current;
    if (gridApi === null) return [];

    return gridFilteredSortedRowIdsSelector(apiRef).reduce<
      TabulationPosition[]
    >((acc, rowId) => {
      const row: PositionGridRow | null =
        gridApi.getRow<PositionGridRow>(rowId);
      if (row === null || row === undefined) return acc;
      if (row.rowType !== "account") return acc;

      const { positionId, rowType, ...position } = row;
      void positionId;
      void rowType;
      acc.push(position);
      return acc;
    }, []);
  };

  const handleExportPdf = async (): Promise<void> => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      await exportPositionsToPdf({
        clientTicker,
        meetingTitle,
        positions: collectExportPositions(),
      });
      setIsExporting(false);
    } catch {
      setIsExporting(false);
    }
  };

  const handleExportXlsx = (): void => {
    exportPositionsToXlsx({
      clientTicker,
      meetingTitle,
      positions: collectExportPositions(),
    });
  };

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        apiRef={apiRef}
        autoHeight
        columns={columns}
        rows={gridRows}
        loading={loading}
        showToolbar
        disableRowSelectionOnClick
        getRowHeight={getPositionRowHeight}
        getRowClassName={(parameters) =>
          parameters.row.rowType === "details" ? "position-detail-row" : ""
        }
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
            additionalExportMenuItems: (onMenuItemClick) => [
              <MenuItem
                disabled={isExporting}
                key="export-pdf"
                onClick={() => {
                  onMenuItemClick();
                  void handleExportPdf();
                }}
              >
                {isExporting ? "Generating PDF…" : "Export as PDF"}
              </MenuItem>,
              <MenuItem
                key="export-excel"
                onClick={() => {
                  onMenuItemClick();
                  handleExportXlsx();
                }}
              >
                Export as Excel
              </MenuItem>,
            ],
            csvOptions: {
              disableToolbarButton: true,
            },
            printOptions: {
              disableToolbarButton: true,
            },
            quickFilterProps: {
              debounceMs: 300,
            },
          },
        }}
        sx={{
          border: 0,
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
            outline: "none",
          },
          "& .position-detail-row .MuiDataGrid-cell": {
            alignItems: "stretch",
            backgroundColor: "var(--mui-palette-background-default)",
            borderBottom: 0,
            py: 0,
          },
        }}
      />
    </Box>
  );
};

export default PositionsTable;
