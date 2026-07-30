"use client";

import { Tooltip, Typography } from "@mui/material";
import React from "react";

import { normalizeCusips } from "@/utils/cusipDisplay";

interface CusipValueProps {
  value?: string | string[] | null;
  variant?: "body3" | "body2" | "caption";
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
    <Tooltip title={cusips.slice(1).join(", ")}>
      <Typography component="span" variant={variant}>
        {`${cusips[0]} +${cusips.length - 1}`}
      </Typography>
    </Tooltip>
  );
};

export default CusipValue;
