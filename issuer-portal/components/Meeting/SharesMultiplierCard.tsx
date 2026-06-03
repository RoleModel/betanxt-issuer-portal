"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  className?: string;
}

const MeetingRolesCard: React.FC<MeetingRolesCardProps> = ({ className }) => {
  // Mock data matching the Figma design
  const accessItems: MeetingAccessItem[] = [
    {
      label: "88554D205",
      type: "string",
      string: "4:1 Voting Multiplier",
    },
    {
      label: "88554D205",
      type: "string",
      string: "4:1 Voting Multiplier",
    },
    {
      label: "Shares Per Shareholder",
      type: "string",
      string: "B Shares",
    },
  ];

  return (
    <Card className={className}>
      <CardHeader title="Shares Multiplier" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>Voting shares for the meeting.</SROnlyTableCaption>
          <TableHead aria-hidden="false" sx={{ visibility: "hidden", display: "none" }}>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Value/Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessItems.map((item, index) => (
              <TableRow
                key={index}
                sx={{
                  "&:not(:last-child)": {
                    borderBottom: "1px solid rgba(31,30,28,0.12)",
                  },
                }}
              >
                <TableCell>{item.label}</TableCell>
                <TableCell align="right">{item.string}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MeetingRolesCard;
