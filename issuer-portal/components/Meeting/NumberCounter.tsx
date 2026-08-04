import { useMediaQuery, useTheme } from "@mui/material";
import { BNTypographyPair } from "@rolemodel/betanxt-design-system/components/BNTypographyPair";
import { useMemo } from "react";

export const NumberCounter = ({
  label,
  isPercent,
  suffix,
  endValue = 100,
  notation = "compact",
  compactDisplay = "short",
}: {
  readonly isPercent?: boolean;
  readonly label?: string;
  readonly suffix?: string;
  readonly startValue?: number;
  readonly endValue?: number;
  readonly notation?: "compact" | "standard";
  readonly compactDisplay?: "short" | "long";
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const safeEnd = Number.isFinite(Number(endValue)) ? Number(endValue) : 0;

  const formatter = useMemo(
    (): Intl.NumberFormat =>
      new Intl.NumberFormat("en-US", {
        notation,
        compactDisplay,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [notation, compactDisplay]
  );

  const formatNumber = (value: number): string => {
    const formatted = formatter.format(value);
    return `${formatted}${isPercent ? "%" : (suffix ?? "")}`;
  };

  return (
    <BNTypographyPair
      primary={{
        text: label ?? "",
        variant: "body3",
        fontWeight: 500,
      }}
      secondary={{
        text: formatNumber(safeEnd),
        variant: "h2",
        fontWeight: 700,
        sx: { fontVariantNumeric: "tabular-nums" },
      }}
      direction="column"
      alignItems={isMobile ? "flex-start" : "flex-end"}
      spacing={0.5}
    />
  );
};
