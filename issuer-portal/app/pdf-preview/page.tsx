"use client";

import { Box, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";

// Dynamically import the PDF viewer component with SSR disabled
const PDFPreview = dynamic(
  async () => await import("@/components/PDFPreview"),
  {
    ssr: false,
    loading: () => (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Box>Loading PDF preview...</Box>
      </Box>
    ),
  }
);

const PDFPreviewPage = () => {
  return <PDFPreview />;
};

export default PDFPreviewPage;
