"use client";

import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import type { components } from "@/domain-models/generated-schema";

import SkeletonTable from "@/components/ui/SkeletonTable";
import SROnlyTableCaption from "@/components/ui/SROnlyTableCaption";
import { useMailing } from "@/hooks/useMailing";

type MailingType = components["schemas"]["Mailing"];

export interface MailingMetric {
  label: string;
  value?: string | number | null;
  group?: string;
}

interface MailingDataCardProps {
  meetingId?: string;
  metrics?: MailingMetric[];
  loading?: boolean;
}

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("en-US");
};

interface MetricDefinition {
  label: string;
  group?: string;
  key?: keyof MailingType;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  { label: "Totals", group: "section" },
  { label: "Accounts", key: "totalAccounts" },
  { label: "Positions", key: "totalPositions" },
  { label: "Retransmissions", key: "totalRetransmissions" },
  { label: "Rollups", key: "totalRollups" },
  { label: "Mail Positions", group: "section" },
  { label: "Full Set", key: "fullsetMailPositions" },
  { label: "NAA", key: "naaMailPositions" },
  { label: "Courtesy/Other", key: "courtesyOtherMailPositions" },
  { label: "Electronic", key: "electronicSuppressedPositions" },
  { label: "Suppressed Positions", group: "section" },
  { label: "Household", key: "householdSuppressedPositions" },
  { label: "Consolidated", key: "consolidatedSuppressedPositions" },
  { label: "Canceled", key: "canceledSuppressedPositions" },
];

const buildMetricsFromMailing = (
  mailing: MailingType | null
): MailingMetric[] =>
  METRIC_DEFINITIONS.map((def) => {
    if (def.group) return { label: def.label, group: def.group };
    const raw = def.key && mailing ? mailing[def.key] : null;
    const value = typeof raw === "number" ? formatNumber(raw) : "0";
    return { label: def.label, value };
  });

const MailingDataCard: React.FC<MailingDataCardProps> = ({
  meetingId,
  metrics,
  loading: externalLoading,
}) => {
  const { getMailingByMeetingId, loading: hookLoading } = useMailing();
  const [mailingData, setMailingData] = useState<MailingType | null>(null);

  useEffect(() => {
    if (meetingId && !metrics) {
      void getMailingByMeetingId(meetingId).then((data) => {
        setMailingData(data);
      });
    }
  }, [meetingId, metrics, getMailingByMeetingId]);

  const loading = externalLoading || hookLoading;
  const displayMetrics = metrics || buildMetricsFromMailing(mailingData);

  interface GroupRow {
    section: string;
    items: MailingMetric[];
  }
  const groupRows: GroupRow[] = [];
  let current: GroupRow | null = null;
  for (const m of displayMetrics) {
    if (m.group === "section") {
      if (current) groupRows.push(current);
      current = { section: m.label, items: [] };
    } else if (current) {
      current.items.push(m);
    }
  }
  if (current) groupRows.push(current);

  if (loading) {
    return (
      <Card variant="outlined" elevation={0}>
        <CardContent sx={{ "&:last-child": { pb: 0 } }}>
          <SkeletonTable columns={4} rows={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" elevation={0}>
      <CardContent sx={{ "&:last-child": { p: 0, overflowX: "auto" } }}>
        <Table size="small" sx={{ width: "100%", border: "none" }}>
          <SROnlyTableCaption>
            Mailing job status and breakdown metrics.
          </SROnlyTableCaption>
          <TableHead
            aria-hidden="false"
            sx={{ visibility: "hidden", display: "none" }}
          >
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupRows.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{
                  "&:not(:last-child)": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  },
                }}
              >
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    pr: 2,
                    verticalAlign: "middle",
                    backgroundColor: "background.default",
                    width: 160,
                    border: "none",
                  }}
                >
                  {row.section}
                </TableCell>
                {row.items.map((item, cIdx) => {
                  const displayValue =
                    item.value === null ||
                    item.value === undefined ||
                    item.value === ""
                      ? "0"
                      : item.value;
                  return (
                    <TableCell key={cIdx} sx={{ py: 1, border: "none" }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        variant="body3"
                        sx={{
                          fontWeight: 500,
                          ["fontVariantNumeric"]: "tabularNums",
                        }}
                      >
                        {displayValue}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MailingDataCard;
