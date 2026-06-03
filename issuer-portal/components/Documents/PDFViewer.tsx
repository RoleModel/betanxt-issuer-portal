"use client";

import { Box, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

const Document = dynamic(
  () =>
    import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      return mod.Document;
    }),
  { ssr: false, loading: () => null },
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

interface PDFViewerProps {
  file: string;
  pageNumber: number;
  width?: number;
  className?: string;
  onLoadSuccess?: (pdf: { numPages: number }) => void;
  onLoadError?: (error: Error) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  pageNumber,
  width = 400,
  className,
  onLoadSuccess,
  onLoadError,
}) => {
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [actualWidth, setActualWidth] = useState<number | null>(null);

  const isPdfFile =
    file?.toLowerCase().endsWith(".pdf") ||
    file?.includes("/test-pdf") ||
    file?.startsWith("data:application/pdf");

  useEffect(() => {
    setActualWidth(width);
  }, [width]);

  useEffect(() => {
    if (!isPdfFile && onLoadError) {
      onLoadError(new Error(`PDFViewer: File is not a PDF (${file})`));
    }
  }, [isPdfFile, file, onLoadError]);

  useEffect(() => {
    setIsPdfLoaded(false);
  }, [file]);

  if (!isPdfFile) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <div>Cannot display non-PDF file in PDF viewer</div>
      </Box>
    );
  }

  const handleLoadSuccess = (pdf: { numPages: number }) => {
    setIsPdfLoaded(true);
    if (onLoadSuccess) {
      onLoadSuccess(pdf);
    }
  };

  const handleLoadError = (error: Error) => {
    setIsPdfLoaded(false);
    if (onLoadError) {
      onLoadError(error);
    }
  };

  const isValidFile = file && typeof file === "string" && file.trim() !== "";

  if (!isValidFile) {
    return (
      <Box
        sx={{
          width: width,
          minHeight: width * 1.294,
          backgroundColor: "var(--mui-palette-background-paper)",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
        }}
      >
        <div>No PDF file specified</div>
      </Box>
    );
  }

  if (actualWidth === null) {
    const defaultWidth = width;
    return (
      <Box
        sx={{
          position: "relative",
          width: defaultWidth,
          minHeight: defaultWidth * 1.294,
          maxHeight: "90vh",
          backgroundColor: "var(--mui-palette-background-paper)",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {!isPdfLoaded && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--mui-palette-background-paper)",
            borderRadius: "4px",
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ opacity: isPdfLoaded ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}>
        <Document
          file={file}
          className={className}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={400}
              sx={{ opacity: isPdfLoaded ? 1 : 0, transition: "opacity 3s ease-in-out" }}
            >
              <div>Failed to load PDF document</div>
            </Box>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={actualWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            error={
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <div>Failed to render page {pageNumber}</div>
              </Box>
            }
          />
        </Document>
      </Box>
    </Box>
  );
};

export default PDFViewer;
