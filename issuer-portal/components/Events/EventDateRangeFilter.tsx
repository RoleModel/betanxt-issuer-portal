"use client";

import type {
  GridFilterInputValueProps,
  GridFilterOperator,
} from "@mui/x-data-grid-pro";

import { Stack } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import type { EventRow } from "@/utils/eventData";

/**
 * A filter value is `[start, end]`, each an ISO `yyyy-MM-dd` string or empty.
 *
 * @remarks
 * Stored as strings rather than `Date` objects because saved filters are
 * persisted as JSON — a `Date` round-trips back as a string and would break the
 * comparison on reload.
 */
type DateRangeValue = readonly [string, string];

const emptyRange: DateRangeValue = ["", ""];

const toRangeValue = (value: unknown): DateRangeValue => {
  if (!Array.isArray(value)) {
    return emptyRange;
  }

  const [start, end] = value;
  return [
    typeof start === "string" ? start : "",
    typeof end === "string" ? end : "",
  ];
};

/** `yyyy-MM-dd` in local time, so a picked day is never shifted by the zone. */
const toIsoDate = (date: Date | null): string => {
  if (date === null || Number.isNaN(date.getTime())) {
    return "";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const fromIsoDate = (value: string): Date | null => {
  if (value.length === 0) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Midnight-to-midnight, so both endpoints are inclusive whole days. */
const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Two date pickers standing in for the usual operator + single-value input.
 *
 * @remarks
 * Either end may be left blank, which makes the range open on that side — "from
 * 1 March" and "up to 31 March" are both useful without forcing a second pick.
 */
const EventDateRangeInput = ({
  applyValue,
  focusElementRef,
  item,
}: GridFilterInputValueProps) => {
  const [start, end] = toRangeValue(item.value);

  const applyRange = (next: DateRangeValue): void => {
    // Clearing both ends removes the filter rather than matching nothing.
    applyValue({
      ...item,
      value: next[0].length === 0 && next[1].length === 0 ? undefined : next,
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* The marker lets the panel hide the operator select on this row only —
          "Between" is the only operator, so the dropdown is dead weight. */}
      <Stack data-event-date-range direction="row" spacing={1} sx={{ pt: 1 }}>
        <DatePicker
          label="Start date"
          maxDate={fromIsoDate(end) ?? undefined}
          onChange={(value) => {
            applyRange([toIsoDate(value), end]);
          }}
          slotProps={{
            field: { clearable: true },
            textField: { inputRef: focusElementRef, size: "small" },
          }}
          value={fromIsoDate(start)}
        />
        <DatePicker
          label="End date"
          minDate={fromIsoDate(start) ?? undefined}
          onChange={(value) => {
            applyRange([start, toIsoDate(value)]);
          }}
          slotProps={{
            field: { clearable: true },
            textField: { size: "small" },
          }}
          value={fromIsoDate(end)}
        />
      </Stack>
    </LocalizationProvider>
  );
};

/**
 * The only operator offered on the event-date column.
 *
 * @remarks
 * Replaces the built-in date operators ("is", "is after", "is on or before", …)
 * with a single inclusive range, so the column reads as one question — which
 * window of dates — instead of an operator the reader has to decode.
 */
export const eventDateRangeOperator: GridFilterOperator<EventRow, Date | null> =
  {
    InputComponent: EventDateRangeInput,
    getApplyFilterFn: (filterItem) => {
      const [start, end] = toRangeValue(filterItem.value);
      const startDate = fromIsoDate(start);
      const endDate = fromIsoDate(end);

      if (startDate === null && endDate === null) {
        return null;
      }

      return (value) => {
        if (!(value instanceof Date)) {
          return false;
        }

        const day = startOfDay(value);
        return (
          (startDate === null || day >= startOfDay(startDate)) &&
          (endDate === null || day <= startOfDay(endDate))
        );
      };
    },
    label: "Between",
    value: "between",
  };
