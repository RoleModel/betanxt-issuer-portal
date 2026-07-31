import {
  getGridDateOperators,
  getGridNumericOperators,
  getGridSingleSelectOperators,
  getGridStringOperators,
} from "@mui/x-data-grid";

const includedTextOperators = new Set([
  "contains",
  "equals",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
]);

const includedNumericOperators = new Set([
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "isEmpty",
  "isNotEmpty",
]);

export const textFilterOperators = getGridStringOperators().filter((operator) =>
  includedTextOperators.has(operator.value)
);

export const numericFilterOperators = getGridNumericOperators().filter(
  (operator) => includedNumericOperators.has(operator.value)
);

export const dateFilterOperators = getGridDateOperators();

export const singleSelectFilterOperators = getGridSingleSelectOperators();

export const getDistinctStringValues = <Row>(
  rows: readonly Row[],
  getValue: (row: Row) => string | null
): string[] => [
  ...new Set(
    rows
      .map((row) => getValue(row))
      .filter((value): value is string => value !== null && value.length > 0)
  ),
];
