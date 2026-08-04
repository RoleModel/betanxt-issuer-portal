"use client";

import { Box } from "@mui/material";
import React from "react";

import { PageTitle } from "@/components/PageTitle";

const ProductsLayout = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  return (
    <>
      <PageTitle>Products</PageTitle>
      <Box flexGrow={1}>{children}</Box>
    </>
  );
};

export default ProductsLayout;
