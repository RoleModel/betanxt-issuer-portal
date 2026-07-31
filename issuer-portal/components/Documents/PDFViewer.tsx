"use client";

import { Box, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";

import { pdfWorkerSource } from "@/lib/pdf-worker";

const Document = dynamic(
  async () =>
    await import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSource;
      return mod.Document;
    }),
  { ssr: false, loading: () => null }
);

const Page = dynamic(
  async () => await import("react-pdf").then((mod) => mod.Page),
  {
    ssr: false,
  }
);

interface PDFViewerProps {
  readonly file: string;
  readonly pageNumber: number;
  readonly width?: number;
  readonly className?: string;
  readonly onLoadSuccess?: (pdf: { numPages: number }) => void;
  readonly onLoadError?: (error: Error) => void;
}

interface PDFDocumentViewProps {
  readonly file: string;
  readonly pageNumber: number;
  readonly width: number;
  readonly className?: string;
  readonly onLoadSuccess?: (pdf: { numPages: number }) => void;
  readonly onLoadError?: (error: Error) => void;
}

// Owns the load state for a single file. PDFViewer remounts this via a `key`
// on the file prop, so the load state resets automatically without an effect.
const PDFDocumentView: React.FC<PDFDocumentViewProps> = ({
  file,
  pageNumber,
  width,
  className,
  onLoadSuccess,
  onLoadError,
}) => {
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);

  const handleLoadSuccess = (pdf: { numPages: number }): void => {
    setIsPdfLoaded(true);
    if (onLoadSuccess) {
      onLoadSuccess(pdf);
    }
  };

  const handleLoadError = (error: Error): void => {
    setIsPdfLoaded(false);
    if (onLoadError) {
      onLoadError(error);
    }
  };

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
      <Box
        sx={{
          opacity: isPdfLoaded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
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
              sx={{
                opacity: isPdfLoaded ? 1 : 0,
                transition: "opacity 3s ease-in-out",
              }}
            >
              <div>Failed to load PDF document</div>
            </Box>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            error={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={400}
              >
                <div>Failed to render page {pageNumber}</div>
              </Box>
            }
          />
        </Document>
      </Box>
    </Box>
  );
};

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  pageNumber,
  width = 400,
  className,
  onLoadSuccess,
  onLoadError,
}) => {
  const isPdfFile =
    file?.toLowerCase().endsWith(".pdf") ||
    file?.includes("/test-pdf") ||
    file?.startsWith("data:application/pdf");

  useEffect(() => {
    if (!isPdfFile && onLoadError) {
      onLoadError(new Error(`PDFViewer: File is not a PDF (${file})`));
    }
  }, [isPdfFile, file, onLoadError]);

  if (!isPdfFile) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <div>Cannot display non-PDF file in PDF viewer</div>
      </Box>
    );
  }

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

  return (
    <PDFDocumentView
      key={file}
      file={file}
      pageNumber={pageNumber}
      width={width}
      className={className}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
    />
  );
};

export default PDFViewer;
