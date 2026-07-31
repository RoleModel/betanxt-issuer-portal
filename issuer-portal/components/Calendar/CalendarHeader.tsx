/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

"use client";

import {
  AddOutlined as AddIcon,
  CalendarViewDay as CalendarViewDayIcon,
  DownloadOutlined as DownloadIcon,
  CalendarMonthOutlined as MonthIcon,
  PrintOutlined as PrintIcon,
  SearchOutlined as SearchIcon,
  ShareOutlined as ShareIcon,
  ZoomInMapOutlined as ZoomInMapOutlinedIcon,
  ZoomOutMapOutlined as ZoomOutMapOutlinedIcon,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

export type CalendarViewType = "month" | "list";

interface CalendarHeaderProps {
  readonly view: CalendarViewType;
  readonly onViewChange: (view: CalendarViewType) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly statusFilter: string;
  readonly onStatusFilterChange: (status: string) => void;
  readonly phaseFilter: number | null;
  readonly onPhaseFilterChange: (phase: number | null) => void;
}

interface CalendarHeaderPropsInternal extends CalendarHeaderProps {
  readonly isFullscreen?: boolean;
  readonly onFullscreenToggle?: () => void;
  readonly onAddClick?: () => void;
  readonly onPrint?: () => void;
  readonly onExportIcs?: () => void;
  readonly onExportPdf?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderPropsInternal> = ({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  isFullscreen = false,
  onFullscreenToggle,
  onAddClick,
  onPrint,
  onExportIcs,
  onExportPdf,
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const shareMenuOpen = Boolean(shareMenuAnchor);

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded && searchQuery) {
      onSearchChange("");
    }
  };

  const handleSearchCollapse = () => {
    setSearchExpanded(false);
  };

  const handleShareMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };

  const handlePrint = () => {
    handleShareMenuClose();
    onPrint?.();
  };

  const handleExportIcs = () => {
    handleShareMenuClose();
    onExportIcs?.();
  };

  const handleExportPdf = () => {
    handleShareMenuClose();
    onExportPdf?.();
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        px: 3,
        py: 2,
        background: theme.vars?.palette?.appSwitcher?.background,
        color: theme.vars?.palette?.appSwitcher?.contrastText,
        borderRadius: 0,
        position: isFullscreen ? "relative" : "sticky",
        borderBottom: (theme) => `1px solid ${theme.vars?.palette?.divider}`,
        top: isFullscreen ? 0 : undefined,
        zIndex: 1000,
      })}
    >
      {/* Main header row */}
      <Box
        display="flex"
        gap={1}
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent={{ xs: "stretch", sm: "space-between" }}
      >
        <Box flex="1">
          <Typography variant="h3" fontWeight={700} color="inherit">
            Meeting Calendar
          </Typography>
          <Typography variant="body3" color="inherit" sx={{ opacity: 0.9 }}>
            Annual Meeting
          </Typography>
        </Box>

        <Box
          display="flex"
          flex="1"
          justifyContent="flex-end"
          alignItems="center"
          gap={1.5}
        >
          <CalendarHeaderSearch
            searchExpanded={searchExpanded}
            searchQuery={searchQuery}
            onToggle={handleSearchToggle}
            onSearchChange={onSearchChange}
            onCollapse={handleSearchCollapse}
          />

          <CalendarHeaderViewToggle view={view} onViewChange={onViewChange} />

          <CalendarHeaderActions
            isFullscreen={isFullscreen}
            shareMenuOpen={shareMenuOpen}
            onAddClick={onAddClick}
            onShareMenuOpen={handleShareMenuOpen}
            onFullscreenToggle={onFullscreenToggle}
          />
        </Box>
      </Box>

      <CalendarShareMenu
        anchorEl={shareMenuAnchor}
        open={shareMenuOpen}
        onClose={handleShareMenuClose}
        onPrint={handlePrint}
        onExportIcs={handleExportIcs}
        onExportPdf={handleExportPdf}
      />
    </Paper>
  );
};

interface CalendarHeaderSearchProps {
  readonly searchExpanded: boolean;
  readonly searchQuery: string;
  readonly onToggle: () => void;
  readonly onSearchChange: (query: string) => void;
  readonly onCollapse: () => void;
}

const CalendarHeaderSearch: React.FC<CalendarHeaderSearchProps> = ({
  searchExpanded,
  searchQuery,
  onToggle,
  onSearchChange,
  onCollapse,
}) => (
  <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
    <IconButton
      onClick={onToggle}
      aria-label={searchExpanded ? "Close search" : "Open search"}
      sx={{
        color: (theme) => theme.vars?.palette?.common.white,
        p: 1,
        "&:hover": {
          background: (theme) =>
            `rgba(${theme.vars?.palette?.primary.lightChannel} / 0.2)`,
        },
      }}
    >
      <SearchIcon fontSize="medium" />
    </IconButton>

    <Collapse
      in={searchExpanded}
      orientation="horizontal"
      sx={{
        position: "absolute",
        right: 0,
        zIndex: 10,
      }}
    >
      <TextField
        size="small"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
        }}
        autoFocus={searchExpanded}
        onBlur={() => {
          if (!searchQuery) {
            onCollapse();
          }
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  fontSize="medium"
                  sx={{
                    color: (theme) => theme.vars?.palette?.common.white,
                  }}
                />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          width: 250,
          ml: 1,
          "& .MuiOutlinedInput-root": {
            backgroundColor: (theme) =>
              theme.vars?.palette?.appSwitcher?.background,
            color: (theme) => theme.vars?.palette?.common.white,
            fontSize: "0.875rem",
            height: 40,
            "& fieldset": {
              borderColor: "rgba(255,255,255,0.5)",
              borderWidth: 1,
            },
            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: (theme) => theme.vars?.palette?.primary.light,
              borderWidth: 2,
            },
          },
        }}
      />
    </Collapse>
  </Box>
);

interface CalendarHeaderViewToggleProps {
  readonly view: CalendarViewType;
  readonly onViewChange: (view: CalendarViewType) => void;
}

const CalendarHeaderViewToggle: React.FC<CalendarHeaderViewToggleProps> = ({
  view,
  onViewChange,
}) => (
  <ToggleButtonGroup
    value={view}
    exclusive
    onChange={(_, newView: CalendarViewType | null) => {
      if (newView) onViewChange(newView);
    }}
    aria-label="calendar view"
    size="small"
    sx={{
      display: { xs: "none", sm: "flex" },
      height: 40,
      "& .MuiToggleButton-root": {
        color: (theme) => theme.vars?.palette?.common.white,
        borderColor: (theme) => theme.vars?.palette?.primary.light,
        "&.Mui-selected": {
          background: (theme) => theme.vars?.palette?.primary.light,
          color: (theme) => theme.vars?.palette?.common.white,
          "&:hover": {
            background: (theme) => theme.vars?.palette?.primary.light,
          },
        },
        "&:hover": {
          background: "rgba(255,255,255,0.1)",
          color: (theme) => theme.vars?.palette?.primary.light,
        },
      },
    }}
  >
    <ToggleButton value="month" aria-label="month view">
      <MonthIcon fontSize="medium" />
    </ToggleButton>
    <ToggleButton value="list" aria-label="list view">
      <CalendarViewDayIcon fontSize="medium" />
    </ToggleButton>
  </ToggleButtonGroup>
);

interface CalendarHeaderActionsProps {
  readonly isFullscreen: boolean;
  readonly shareMenuOpen: boolean;
  readonly onAddClick?: () => void;
  readonly onShareMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  readonly onFullscreenToggle?: () => void;
}

const CalendarHeaderActions: React.FC<CalendarHeaderActionsProps> = ({
  isFullscreen,
  shareMenuOpen,
  onAddClick,
  onShareMenuOpen,
  onFullscreenToggle,
}) => (
  <Box display="flex" alignItems="center" gap={0.5}>
    <Box
      component="button"
      onClick={onAddClick}
      aria-label="Add new task"
      sx={{
        p: 1,
        borderRadius: "50%",
        background: "transparent",
        border: "none",
        color: (theme) => theme.vars?.palette?.common.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          background: (theme) =>
            `rgba(${theme.vars?.palette?.primary.lightChannel} / 0.2)`,
        },
      }}
    >
      <AddIcon fontSize="medium" />
    </Box>
    <Box
      component="button"
      onClick={onShareMenuOpen}
      aria-label="Share calendar"
      aria-controls={shareMenuOpen ? "share-menu" : undefined}
      aria-haspopup="true"
      aria-expanded={shareMenuOpen ? "true" : undefined}
      sx={{
        p: 1,
        borderRadius: "50%",
        background: "transparent",
        border: "none",
        color: (theme) => theme.vars?.palette?.common.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          background: (theme) =>
            `rgba(${theme.vars?.palette?.primary.lightChannel} / 0.2)`,
        },
      }}
    >
      <ShareIcon fontSize="medium" />
    </Box>
    <Box
      component="button"
      onClick={onFullscreenToggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      sx={{
        p: 1,
        borderRadius: "50%",
        background: "transparent",
        border: "none",
        color: (theme) => theme.vars?.palette?.common.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          background: (theme) =>
            `rgba(${theme.vars?.palette?.primary.lightChannel} / 0.2)`,
        },
      }}
    >
      {isFullscreen ? (
        <ZoomInMapOutlinedIcon fontSize="medium" />
      ) : (
        <ZoomOutMapOutlinedIcon fontSize="medium" />
      )}
    </Box>
  </Box>
);

interface CalendarShareMenuProps {
  readonly anchorEl: HTMLElement | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPrint: () => void;
  readonly onExportIcs: () => void;
  readonly onExportPdf: () => void;
}

const CalendarShareMenu: React.FC<CalendarShareMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onPrint,
  onExportIcs,
  onExportPdf,
}) => (
  <Menu
    id="share-menu"
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    MenuListProps={{
      "aria-labelledby": "share-button",
    }}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
  >
    <MenuItem onClick={onPrint}>
      <ListItemIcon>
        <PrintIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Print</ListItemText>
    </MenuItem>
    <MenuItem onClick={onExportIcs}>
      <ListItemIcon>
        <DownloadIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Export .ics</ListItemText>
    </MenuItem>
    <MenuItem onClick={onExportPdf}>
      <ListItemIcon>
        <DownloadIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Export Timeline PDF</ListItemText>
    </MenuItem>
  </Menu>
);

export default CalendarHeader;
