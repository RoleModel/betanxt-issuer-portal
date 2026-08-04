"use client";

import { Box } from "@mui/material";
import React from "react";

import { PageTitle } from "@/components/PageTitle";

const EducationLayout = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  return (
    <>
      <PageTitle>Education</PageTitle>
      <Box flexGrow={1}>{children}</Box>
    </>
  );
};

export default EducationLayout;
