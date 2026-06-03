"use client";

import { Box, Container } from "@mui/material";
import React from "react";

interface ProductLayoutProps {
  leftColumnContent: React.ReactElement;
  rightColumnContent: React.ReactElement;
  documentViewer?: React.ReactElement;
}

export default function ProductLayout({
  leftColumnContent,
  rightColumnContent,
  documentViewer,
}: ProductLayoutProps) {
  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{
        my: {
          xs: 1,
          sm: 3,
        },
        px: {
          xs: 1,
          sm: 10,
        },
        display: {
          xs: "flex",
          md: "grid",
        },
        gridTemplateColumns: {
          xs: "1fr",
          md: "1fr 0.4fr",
        },
        flexGrow1: 1,
        flexDirection: {
          xs: "column",
        },
        gap: 3,
      }}
    >
      <Box
        sx={{
          sm: {
            order: 2,
          },
          md: {
            order: 1,
          },
        }}
      >
        {leftColumnContent}
      </Box>
      <Box
        sx={{
          mt: {
            sm: 0,
            md: 25,
          },
          order: {
            sm: 1,
            md: 2,
          },
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: {
              sm: 2,
              md: 25,
            },
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {rightColumnContent}
        </Box>
      </Box>
      {documentViewer}
    </Container>
  );
}
