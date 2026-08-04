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

interface MeetingInformationCardProps {
  readonly className?: string;
  readonly meeting?: {
    meetingType?: string;
    cusip?: string;
    ticker?: string;
  };
}

const MeetingInformationCard: React.FC<MeetingInformationCardProps> = ({
  className,
  meeting,
}) => {
  const meetingInfo = [
    { label: "Meeting Type", value: meeting?.meetingType },
    { label: "Company CUSIP(s)", value: meeting?.cusip },
    { label: "Ticker", value: meeting?.ticker },
  ];

  return (
    <Card
      className={className}
      sx={{
        gridArea: "meeting-information",
        alignSelf: "start",
        height: "100%",
      }}
    >
      <CardHeader title="Meeting Information" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Table>
          <SROnlyTableCaption>
            Meeting details including type, inspector, and company CUSIP.
          </SROnlyTableCaption>
          <TableHead
            aria-hidden="false"
            sx={{ visibility: "hidden", display: "none" }}
          >
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meetingInfo.map((info) => (
              <TableRow
                key={info.label}
                sx={{
                  "&:not(:last-child)": {
                    borderBottom: "1px solid rgba(31,30,28,0.12)",
                  },
                }}
              >
                <TableCell>{info.label}</TableCell>
                <TableCell align="right">{info.value ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MeetingInformationCard;
