"use client";

import { Typography } from "@mui/material";
import React from "react";

import { normalizeCusips } from "@/utils/cusipDisplay";
import { CustomTooltip } from "@/components/ui/CustomToolTip";

interface CusipValueProps {
  readonly value?: string | string[] | null;
  readonly variant?: "body3" | "body2" | "caption";
}

const CusipValue = ({ value, variant = "body3" }: CusipValueProps) => {
  const cusips = normalizeCusips(value);

  if (cusips.length === 0) {
    return (
      <Typography component="span" variant={variant}>
        N/A
      </Typography>
    );
  }

  if (cusips.length === 1) {
    return (
      <Typography component="span" variant={variant}>
        {cusips[0]}
      </Typography>
    );
  }

  return (
    <CustomTooltip title={cusips.slice(1).join(", ")}>
      <Typography component="span" variant={variant}>
        {`${cusips[0]} +${cusips.length - 1}`}
      </Typography>
    </CustomTooltip>
  );
};

export default CusipValue;
