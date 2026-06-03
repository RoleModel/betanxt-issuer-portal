"use client";

import { LinearProgress } from "@mui/material";
import React from "react";

export default function Loading() {
  return (
    <LinearProgress
      sx={{
        height: 4,
      }}
    />
  );
}
