"use client";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import React, { useState } from "react";

import type { TabulationFilters, TabulationPosition } from "@/hooks/useTabulationInsights";
import type { ProposalVoting } from "@/types/phases";

import VotingTabulationTable from "@/components/Meeting/VotingTabulationTable";
import PositionsTable from "@/components/Tabulation/PositionsTable";
import { exportPositionsToPdf } from "@/utils/exportPositionsPdf";
import { exportPositionsToXlsx } from "@/utils/exportPositionsXlsx";

interface FilterOption {
  value: string;
  label: string;
}

interface ProposalDetailsCardProps {
  proposals: ProposalVoting[];
  positions: TabulationPosition[];
  loading?: boolean;
  meetingTitle?: string;
  clientTicker?: string;
  filters: TabulationFilters;
  onFiltersChange: (filters: TabulationFilters) => void;
  accountTypes: FilterOption[];
  setKeys: FilterOption[];
  directors: FilterOption[];
}

export default function ProposalDetailsCard({
  proposals,
  positions,
  loading = false,
  meetingTitle,
  clientTicker,
  filters,
  onFiltersChange,
  accountTypes,
  setKeys,
  directors,
}: ProposalDetailsCardProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

  const handleExportPdf = async () => {
    if (isExporting) return;
    setMenuAnchorEl(null);
    setIsExporting(true);
    try {
      await exportPositionsToPdf({
        positions,
        meetingTitle: meetingTitle ?? "Meeting Positions",
        clientTicker: clientTicker ?? "",
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportXlsx = () => {
    setMenuAnchorEl(null);
    exportPositionsToXlsx({
      positions,
      meetingTitle: meetingTitle ?? "Meeting Positions",
      clientTicker: clientTicker ?? "",
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const resetFilters = () => {
    onFiltersChange({
      searchQuery: "",
      voteStatus: "All",
      holderType: "all",
      accountType: "",
      setKey: "",
      directorProposalId: "",
      controlNumber: "",
      accountNumber: "",
      positionName: "",
      shareLow: "",
      shareHigh: "",
    });
  };

  const headerActions = (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        justifyContent: { xs: "stretch", md: "flex-end" },
        width: "fit-content",
        flex: 1,
      }}
    >
      <TextField
        placeholder="Search Positions"
        size="small"
        value={filters.searchQuery}
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            searchQuery: event.target.value,
          })
        }
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: { xs: "100%", sm: 260 } }}
      />
      <Select
        value={filters.voteStatus}
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            voteStatus: event.target.value,
          })
        }
        size="small"
        displayEmpty
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Voted">Voted</MenuItem>
        <MenuItem value="Unvoted">Not Voted</MenuItem>
      </Select>
      <Button
        variant="text"
        startIcon={<FilterListIcon />}
        onClick={() => setFilterDialogOpen(true)}
      >
        Filters
      </Button>
      {selectedTab === 1 ? (
        <>
          <ButtonGroup variant="outlined" color="primary" disabled={isExporting}>
            <Button
              size="large"
              onClick={() => void handleExportPdf()}
              loading={isExporting}
              loadingIndicator="Generating..."
            >
              Export Positions
            </Button>
            <Button size="large" onClick={handleMenuOpen}>
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => void handleExportPdf()}>Export as PDF</MenuItem>
            <MenuItem onClick={handleExportXlsx}>Export as Excel</MenuItem>
          </Menu>
        </>
      ) : null}
    </Box>
  );

  return (
    <Card>
      <CardHeader
        title="Tabulation"
        action={headerActions}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          "& .MuiCardHeader-action": {
            m: 0,
            width: "auto",
            justifyContent: "end",
          },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Tabs
          value={selectedTab}
          onChange={(_, value: number) => setSelectedTab(value)}
          sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" />
          <Tab label="Positions" />
        </Tabs>

        {selectedTab === 0 ? (
          <VotingTabulationTable proposals={proposals} loading={loading} />
        ) : (
          <PositionsTable positions={positions} loading={loading} />
        )}
      </CardContent>
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Positions</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Holder Type"
                value={filters.holderType}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    holderType: event.target.value as TabulationFilters["holderType"],
                  })
                }
                size="small"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="beneficial">Beneficial</MenuItem>
                <MenuItem value="registered">Registered</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Account Type"
                value={filters.accountType}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    accountType: event.target.value,
                  })
                }
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {accountTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Set Key"
                value={filters.setKey}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    setKey: event.target.value,
                  })
                }
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {setKeys.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Director"
                value={filters.directorProposalId}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    directorProposalId: event.target.value,
                  })
                }
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {directors.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Control #"
                value={filters.controlNumber}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    controlNumber: event.target.value,
                  })
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Account #"
                value={filters.accountNumber}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    accountNumber: event.target.value,
                  })
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={filters.positionName}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    positionName: event.target.value,
                  })
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Share Low"
                type="number"
                value={filters.shareLow}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    shareLow: event.target.value,
                  })
                }
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Share High"
                type="number"
                value={filters.shareHigh}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    shareHigh: event.target.value,
                  })
                }
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setFilterDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="outlined" onClick={resetFilters}>
            Clear Filters
          </Button>
          <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>
            Filter
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
