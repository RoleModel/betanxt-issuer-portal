"use client";

import { ArrowDropDownOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";

import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";

interface MeetingAccessItem {
  label: string;
  type: "confirm" | "string" | "upload";
  value?: boolean;
  string?: string;
  fileFormat?: string;
  fileDescription?: string;
}

interface MeetingRolesCardProps {
  readonly meetingId: string;
  readonly className?: string;
}

const handleConfirm = (label: string) => {
  alert(`Confirm action for ${label}`);
};

// Mock data matching the Figma design
const accessItems: MeetingAccessItem[] = [
  {
    label: "Shares Listed In Proxy Statement",
    type: "string",
    string: "100,000,00",
  },

  {
    label: "Shares from the Files Received",
    type: "confirm",
    string: "100,000,00",
  },
  {
    label: "Proxy Statement Shares in Balance",
    type: "confirm",
  },
  {
    label: "Registered Shares",
    type: "string",
    string: "100,000,00",
  },
  {
    label: "Beneficial Shares",
    type: "string",
    string: "100,000,00",
  },
  {
    label: "Plan File 1 Shares",
    type: "string",
    string: "100,000,00",
  },
  {
    label: "Plan File 2 Shares",
    type: "string",
    string: "100,000,00",
  },
];

const MeetingRolesCard: React.FC<MeetingRolesCardProps> = ({
  className,
  meetingId: _meetingId,
}) => {
  return (
    <Card className={className}>
      <CardHeader title="Voting Shares" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Voting shares for the meeting.
          </SROnlyTableCaption>
          <TableHead
            aria-hidden="false"
            sx={{ visibility: "hidden", display: "none" }}
          >
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Value/Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessItems.map((item) => (
              <TableRow
                key={item.label}
                sx={{
                  "&:not(:last-child)": {
                    borderBottom: "1px solid rgba(31,30,28,0.12)",
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body3">{item.label}</Typography>
                    {item.fileDescription ? (
                      <Typography variant="caption" color="text.secondary">
                        {item.fileFormat} {item.fileDescription}
                      </Typography>
                    ) : null}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {item.type === "confirm" && (
                    <Button
                      endIcon={<ArrowDropDownOutlined />}
                      variant="text"
                      onClick={() => {
                        handleConfirm(item.label);
                      }}
                    >
                      Confirm
                    </Button>
                  )}

                  {item.type === "string" && item.string ? (
                    <Typography variant="body3" sx={{ fontWeight: "medium" }}>
                      {item.string}
                    </Typography>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MeetingRolesCard;
