"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { alpha, useColorScheme, useTheme } from "@mui/material/styles";
import { Heatmap } from "@mui/x-charts-pro/Heatmap";
import { type MouseEvent, useMemo, useState } from "react";

import type { GeoDistributionRow } from "@/hooks/useGeoDistribution";
import type { HolderCategory } from "@/utils/holderCategory";

import { useClientFeatures } from "@/hooks/useClientFeatures";
import {
  INTERNATIONAL_LOCATION,
  UNKNOWN_LOCATION,
  useGeoDistribution,
} from "@/hooks/useGeoDistribution";

/** Which value the heat map encodes: distinct holder counts or total shares held. */
type GeoMetric = "shareholders" | "sharesHeld";

/** Checkbox state for each holder population that can be included in the map. */
interface PopulationState {
  registered: boolean;
  plan: boolean;
  beneficial: boolean;
  nobo: boolean;
}

interface GeoHeatmapCardProps {
  /** Meeting whose positions are aggregated; no data is shown when omitted. */
  meetingId?: string;
}

const METRIC_LABELS: Record<GeoMetric, string> = {
  shareholders: "Shareholders",
  sharesHeld: "Shares Held",
};

/** Fixed column order for the heat map's holder-population x-axis. */
const CATEGORY_COLUMNS: { category: HolderCategory; label: string }[] = [
  { category: "REGISTERED", label: "Registered" },
  { category: "PLAN", label: "Plan" },
  { category: "BENEFICIAL", label: "Beneficial" },
  { category: "NOBO", label: "NOBO" },
];

/** Registered and Plan holders are shown by default; Beneficial/NOBO are opt-in. */
const DEFAULT_POPULATIONS: PopulationState = {
  registered: true,
  plan: true,
  beneficial: false,
  nobo: false,
};

const formatNumber = (value: number): string => value.toLocaleString("en-US");

const getMetricValue = (row: GeoDistributionRow, metric: GeoMetric): number =>
  metric === "shareholders" ? row.shareholderCount : row.sharesHeld;

/**
 * Builds a zero-valued distribution row so the International and Unknown
 * buckets always render at the bottom of the map, even when the data set
 * contains no holders for them.
 *
 * @param location - Display label for the bucket
 * @param kind - Bucket kind (`international` or `unknown`)
 * @returns An empty {@link GeoDistributionRow} for the bucket
 */
const emptyBucket = (location: string, kind: GeoDistributionRow["kind"]): GeoDistributionRow => ({
  location,
  kind,
  shareholderCount: 0,
  sharesHeld: 0,
  byCategory: {},
});

/** Reads the selected metric for one holder category within a location bucket. */
const getCategoryMetricValue = (
  row: GeoDistributionRow,
  category: HolderCategory,
  metric: GeoMetric,
): number => {
  const totals = row.byCategory[category];
  if (!totals) return 0;
  return metric === "shareholders" ? totals.shareholderCount : totals.sharesHeld;
};

/**
 * Heat map of holder geography for a meeting: rows are US states (with fixed
 * International and Unknown rows appended last, states sorted descending by
 * the selected metric) and columns are the included holder populations in
 * Registered → Plan → Beneficial → NOBO order, so each cell shows the metric
 * for one population in one location.
 *
 * A toggle switches the metric between holder counts and shares held, and
 * checkboxes include/exclude population columns. The NOBO checkbox only
 * renders when the client's `nobo` feature flag is enabled, and NOBO rows are
 * excluded from the aggregation regardless of checkbox state while the flag
 * is off. Cell color intensity uses the design system's first chart series
 * color (adapting to the active light/dark color scheme), with a continuous
 * color-scale legend rendered beside the map.
 *
 * Renders a skeleton while loading, the fetch error when one occurs, and an
 * empty state when no positions match the selected populations.
 */
export function GeoHeatmapCard({ meetingId }: GeoHeatmapCardProps) {
  const { mode, systemMode } = useColorScheme();
  const { isEnabled } = useClientFeatures();
  const hasNoboFeature = isEnabled("nobo");
  const theme = useTheme();
  const [metric, setMetric] = useState<GeoMetric>("shareholders");
  const [populations, setPopulations] = useState<PopulationState>(DEFAULT_POPULATIONS);

  const includedCategories = useMemo<HolderCategory[]>(() => {
    const categories: HolderCategory[] = [];
    if (populations.registered) categories.push("REGISTERED");
    if (populations.plan) categories.push("PLAN");
    if (populations.beneficial) categories.push("BENEFICIAL");
    if (populations.nobo && hasNoboFeature) categories.push("NOBO");
    return categories;
  }, [populations, hasNoboFeature]);

  const { rows, loading, error } = useGeoDistribution(meetingId, includedCategories);

  const sortedRows = useMemo<GeoDistributionRow[]>(() => {
    const states = rows
      .filter((row) => row.kind === "state")
      .sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));
    const international =
      rows.find((row) => row.kind === "international") ??
      emptyBucket(INTERNATIONAL_LOCATION, "international");
    const unknown =
      rows.find((row) => row.kind === "unknown") ?? emptyBucket(UNKNOWN_LOCATION, "unknown");
    return [...states, international, unknown];
  }, [rows, metric]);

  const yAxisLabels = useMemo(
    () =>
      sortedRows.map((row) =>
        row.kind === "unknown"
          ? `${UNKNOWN_LOCATION} (${formatNumber(row.shareholderCount)})`
          : row.location,
      ),
    [sortedRows],
  );

  // Columns follow the fixed Registered → Plan → Beneficial → NOBO order,
  // limited to the populations currently checked.
  const columns = useMemo(
    () => CATEGORY_COLUMNS.filter(({ category }) => includedCategories.includes(category)),
    [includedCategories],
  );

  const heatmapData = useMemo<[number, number, number][]>(
    () =>
      sortedRows.flatMap((row, rowIndex) =>
        columns.map<[number, number, number]>(({ category }, columnIndex) => [
          columnIndex,
          rowIndex,
          getCategoryMetricValue(row, category, metric),
        ]),
      ),
    [sortedRows, columns, metric],
  );

  const maxValue = useMemo(
    () =>
      sortedRows.reduce(
        (max, row) =>
          columns.reduce(
            (cellMax, { category }) =>
              Math.max(cellMax, getCategoryMetricValue(row, category, metric)),
            max,
          ),
        0,
      ),
    [sortedRows, columns, metric],
  );

  const resolvedMode = mode === "system" ? systemMode : mode;
  const isDark = resolvedMode === "dark";
  // Design system chart series 0 (NXT Blue) drives the heat ramp.
  const heatColor = theme.palette.primary.main;
  const colorRange: [string, string] = isDark
    ? [alpha(heatColor, 0.52), heatColor]
    : [alpha(heatColor, 0.03), heatColor];

  const hasData = columns.length > 0 && sortedRows.some((row) => getMetricValue(row, metric) > 0);
  const chartHeight = Math.max(280, sortedRows.length * 28 + 48);

  const handleMetricChange = (_event: MouseEvent<HTMLElement>, value: GeoMetric | null) => {
    if (value) setMetric(value);
  };

  const handlePopulationToggle = (key: keyof PopulationState) => {
    setPopulations((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Card>
      <CardHeader
        title="Geographic Distribution"
        subheader="Holder locations by US state, with international and unknown buckets"
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <ToggleButtonGroup
            value={metric}
            exclusive
            size="small"
            onChange={handleMetricChange}
            aria-label="Heat map metric"
          >
            <ToggleButton value="shareholders">{METRIC_LABELS.shareholders}</ToggleButton>
            <ToggleButton value="sharesHeld">{METRIC_LABELS.sharesHeld}</ToggleButton>
          </ToggleButtonGroup>

          <FormGroup row aria-label="Holder populations">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={populations.registered}
                  onChange={() => handlePopulationToggle("registered")}
                />
              }
              label="Registered"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={populations.plan}
                  onChange={() => handlePopulationToggle("plan")}
                />
              }
              label="Plan"
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={populations.beneficial}
                  onChange={() => handlePopulationToggle("beneficial")}
                />
              }
              label="Beneficial"
            />
            {hasNoboFeature && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={populations.nobo}
                    onChange={() => handlePopulationToggle("nobo")}
                  />
                }
                label="NOBO"
              />
            )}
          </FormGroup>
        </Stack>

        {loading ? (
          <Skeleton variant="rounded" height={280} />
        ) : error ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 280,
              color: "error.main",
              typography: "body3",
            }}
          >
            {error}
          </Box>
        ) : !hasData ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 280,
              color: "text.secondary",
              typography: "body3",
            }}
          >
            No positions match the selected populations
          </Box>
        ) : (
          <Heatmap
            height={chartHeight}
            hideLegend={false}
            slotProps={{
              legend: {
                direction: "vertical",
                position: { vertical: "middle", horizontal: "end" },
                minLabel: ({ value }: { value: number | Date }) => formatNumber(Number(value)),
                maxLabel: ({ value }: { value: number | Date }) => formatNumber(Number(value)),
                sx: { height: Math.min(240, chartHeight - 96) },
              },
            }}
            margin={{ right: 16 }}
            xAxis={[{ data: columns.map(({ label }) => label), height: 32 }]}
            yAxis={[{ data: yAxisLabels, width: 120 }]}
            zAxis={[
              {
                colorMap: {
                  type: "continuous",
                  min: 0,
                  max: Math.max(maxValue, 1),
                  color: colorRange,
                },
              },
            ]}
            series={[
              {
                label: METRIC_LABELS[metric],
                data: heatmapData,
                // Accepts both Heatmap formatter shapes seen across @mui/x-charts
                // versions: a plain cell value or an [x, y, value] tuple.
                valueFormatter: (value: number | readonly [number, number, number] | null) =>
                  value === null ? null : formatNumber(Array.isArray(value) ? value[2] : value),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
