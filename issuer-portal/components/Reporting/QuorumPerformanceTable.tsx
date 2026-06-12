"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React from "react";

import SkeletonTable from "@/components/ui/SkeletonTable";

interface QuorumData {
  meetingId: string;
  meetingTitle: string;
  requiredShares: number;
  actualShares: number;
  quorumMet: boolean;
  participationRate: number;
  daysToQuorum: number | null;
}

interface QuorumPerformanceTableProps {
  data: QuorumData[];
  loading?: boolean;
  title?: string;
  clientTicker?: string;
}

/**
 * Per-event quorum performance table: Days to Quorum, Participation %, and
 * whether quorum was met. The Early Votes % / Late Votes % columns were
 * replaced by these in 002-tabulation-enhancements. Event titles link to the
 * event page when a `clientTicker` is provided.
 */
const QuorumPerformanceTable: React.FC<QuorumPerformanceTableProps> = ({
  data,
  loading = false,
  title = "Quorum Performance",
  clientTicker = "",
}) => {
  if (loading) {
    return <SkeletonTable rows={4} columns={4} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            No quorum performance data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // no-op helpers removed

  return (
    <Card>
      <CardHeader title={title} />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell padding="none" align="right">
                  Days to Quorum
                </TableCell>
                <TableCell align="right">Participation %</TableCell>
                <TableCell align="right">Quorum Met</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                const displayTitle = row.meetingTitle;

                return (
                  <TableRow key={`${row.meetingId}-${index}`}>
                    <TableCell size="small" component="th" scope="row">
                      {clientTicker ? (
                        <Button
                          variant="text"
                          color="info"
                          component={Link}
                          href={`/${clientTicker}/meeting/${row.meetingId}`}
                        >
                          {displayTitle}
                        </Button>
                      ) : (
                        <Typography variant="body3" fontWeight={500} noWrap>
                          {displayTitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell size="small" align="right">
                      {row.daysToQuorum ?? "--"}
                    </TableCell>
                    <TableCell size="small" align="right">
                      {row.participationRate.toFixed(1)}%
                    </TableCell>
                    <TableCell size="small" align="right">
                      {row.quorumMet ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default QuorumPerformanceTable;
