export type TabulationDisplayMode = "numbers" | "percentages";

interface TabulationMetric {
  readonly alternate: string;
  readonly display: string;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const formatPercentage = (value: number, total: number): string => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return `${percentage.toFixed(2)}%`;
};

export const formatTabulationMetric = (
  value: number,
  total: number,
  displayMode: TabulationDisplayMode
): TabulationMetric => {
  const numberValue = numberFormatter.format(value);
  const percentageValue = formatPercentage(value, total);

  return displayMode === "numbers"
    ? { alternate: percentageValue, display: numberValue }
    : { alternate: numberValue, display: percentageValue };
};

export const formatTabulationPercentage = (value: number): string =>
  `${value.toFixed(2)}%`;
