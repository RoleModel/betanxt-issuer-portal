"use client";

import {
  FileDownloadOutlined,
  PictureAsPdf,
  TableChart,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import { type ExportOptions, exportAttendees } from "@/utils/attendeeExport";

type DigitalShareholderMeeting =
  components["schemas"]["DigitalShareholderMeeting"];

interface ExportButtonProps {
  readonly attendees: DigitalShareholderMeeting[];
  readonly sectionName?: string;
  readonly disabled?: boolean;
  readonly variant?: "contained" | "outlined" | "text";
  readonly size?: "small" | "medium" | "large";
}

export const ExportButton = ({
  attendees,
  sectionName = "attendees",
  disabled = false,
  variant = "outlined",
  size = "large",
}: ExportButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: ExportOptions["format"]) => {
    setIsExporting(true);
    handleClose();

    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${sectionName.toLowerCase().replace(/\s+/g, "-")}-${timestamp}`;

      exportAttendees(attendees, {
        format,
        filename,
      });
    } catch (error) {
      console.error("Export failed:", error);
      // Could add toast notification here
    } finally {
      // Small delay to show loading state
      setTimeout(() => {
        setIsExporting(false);
      }, 500);
    }
  };

  if (attendees.length === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        startIcon={<FileDownloadOutlined />}
      >
        Export (No Attendees)
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isExporting}
        onClick={handleClick}
        startIcon={
          isExporting ? (
            <CircularProgress size={16} />
          ) : (
            <FileDownloadOutlined />
          )
        }
        aria-controls={open ? "export-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        {isExporting ? "Exporting..." : `Export (${attendees.length})`}
      </Button>
      <Menu
        id="export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "export-button",
          },
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
        <MenuItem
          onClick={() => {
            handleExport("csv");
          }}
        >
          <ListItemIcon>
            <FileDownloadOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Export as CSV"
            secondary="Excel compatible, 5KB"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleExport("excel");
          }}
        >
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Export as Excel"
            secondary="Microsoft Excel format"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleExport("pdf");
          }}
        >
          <ListItemIcon>
            <PictureAsPdf fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Export as PDF"
            secondary="Print-ready document"
          />
        </MenuItem>
      </Menu>
    </>
  );
};
