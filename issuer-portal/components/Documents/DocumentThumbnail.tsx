"use client";

import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

import { ErrorOutlineOutlined } from "@mui/icons-material";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import { Box, CircularProgress } from "@mui/material";
import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import React, { useEffect, useMemo, useState } from "react";

import { pdfWorkerSource } from "@/lib/pdf-worker";
import {
  getFileExtension,
  getStoragePublicUrl,
  isStorageUrl,
} from "@/utils/documentUtils";

import DocumentThumbnailGenerator from "./DocumentThumbnailGenerator";

interface Props {
  filePath?: string | null;
  onClick?: () => void;
  width?: number;
  height?: number;
}

interface DocumentProps {
  file: string | File | null;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  onLoadSuccess?: (pdf: PDFDocumentProxy) => void;
  onLoadError?: (error: Error) => void;
  children?: React.ReactNode;
}

interface PageProps {
  pageNumber: number;
  width?: number;
  height?: number;
  scale?: number;
  renderTextLayer?: boolean;
  renderAnnotationLayer?: boolean;
}

const DocumentThumbnail = ({ filePath, onClick, width = 60 }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [Document, setDocument] =
    useState<React.ComponentType<DocumentProps> | null>(null);
  const [Page, setPage] = useState<React.ComponentType<PageProps> | null>(null);
  const [, setNumPages] = useState<number | null>(null);

  const fileUrl = useMemo(() => {
    if (!filePath) return null;

    // Handle storage URLs (both absolute and relative)
    if (filePath.startsWith("/storage/v1/object/public/")) {
      // Convert relative storage paths to full Supabase URLs
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
      const fullUrl = `${supabaseUrl}${filePath}`;
      console.log(
        "[DocumentThumbnail] Converting relative storage path:",
        filePath,
        "to:",
        fullUrl
      );
      return fullUrl;
    }

    // Absolute URLs
    if (isStorageUrl(filePath)) return filePath;

    // Data URIs
    if (filePath.startsWith("data:")) return filePath;

    // Relative paths: if it's a PDF, treat as Supabase storage path; else use local documents path
    if (!filePath.startsWith("/")) {
      return filePath.toLowerCase().endsWith(".pdf")
        ? getStoragePublicUrl(filePath)
        : `/documents/${filePath}`;
    }

    // Already-rooted path (but not storage paths)
    if (
      filePath.toLowerCase().endsWith(".pdf") &&
      filePath.startsWith("/documents/") &&
      !filePath.startsWith("/storage/")
    ) {
      // Map /documents/<key>.pdf to Supabase storage public URL
      const storageKey = filePath.slice("/documents/".length);
      return getStoragePublicUrl(storageKey);
    }
    return filePath;
  }, [filePath]);

  const isPDF = useMemo(() => {
    if (!fileUrl) return false;
    // Check for .pdf extension or PDF data URI
    return (
      fileUrl.toLowerCase().endsWith(".pdf") ||
      fileUrl.startsWith("data:application/pdf")
    );
  }, [fileUrl]);

  // Derive design-system icon file type (limited union)
  type DesignSystemFileType = "PDF" | "HTML" | "TXT" | "XLS" | "XLSX" | "CSV";
  const iconFileType: DesignSystemFileType = useMemo(() => {
    if (!filePath) return "PDF";

    // Check for PDF data URI first
    if (filePath.startsWith("data:application/pdf")) {
      return "PDF";
    }

    const ext = getFileExtension(filePath).toLowerCase();
    switch (ext) {
      case "pdf":
        return "PDF";
      case "xls":
        return "XLS";
      case "xlsx":
        return "XLSX";
      case "csv":
        return "CSV";
      case "txt":
        return "TXT";
      // Map other document types to a sensible default icon
      case "doc":
      case "docx":
      case "ppt":
      case "pptx":
      default:
        return "PDF";
    }
  }, [filePath]);

  useEffect(() => {
    if (!isPDF || !fileUrl) return;

    let mounted = true;

    const loadPDFComponents = async () => {
      try {
        const { pdfjs } = await import("react-pdf");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSource;

        const pdfComponents = await import("react-pdf");

        if (mounted) {
          setDocument(
            () => pdfComponents.Document as React.ComponentType<DocumentProps>
          );
          setPage(() => pdfComponents.Page as React.ComponentType<PageProps>);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load PDF components for thumbnail:", err);
        if (mounted) {
          setHasError(true);
        }
      }
    };

    void loadPDFComponents();

    return () => {
      mounted = false;
    };
  }, [isPDF, fileUrl]);

  const onDocumentLoadSuccess = (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    // Suppress 400 errors for missing documents in development
    if (
      !error.message.includes("400") &&
      !error.message.includes("Unexpected server response")
    ) {
      console.error("PDF thumbnail load error:", error);
    }
    setHasError(true);
  };

  // Check if this is a mock/development URL that doesn't exist
  // Note: Signed documents may have these paths but should still show previews
  const isMockUrl = false; // Disabled - let all URLs attempt to load

  // No file path provided or mock URL
  if (!fileUrl || isMockUrl) {
    return (
      <Box
        sx={{
          width,
          aspectRatio: "8.5 / 11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
          borderRadius: 1,
          fontSize: "10px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconForFileType fileType={iconFileType} />
      </Box>
    );
  }

  // Non-PDF file - use DocumentThumbnailGenerator for Office docs
  if (!isPDF) {
    const ext = filePath ? getFileExtension(filePath).toLowerCase() : "";
    const isOfficeDoc = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
      ext
    );
    const isAudio = ["mp4", "m4a"].includes(ext);

    if (isOfficeDoc) {
      return (
        <Box
          sx={{
            cursor: onClick ? "pointer" : "default",
          }}
          onClick={onClick}
        >
          <DocumentThumbnailGenerator
            url={fileUrl || undefined}
            fileType={ext}
            title={filePath?.split("/").pop()}
            width={width}
            height={Math.round(width * 1.294)} // 8.5/11 aspect ratio
          />
        </Box>
      );
    }

    if (isAudio) {
      return (
        <Box
          sx={{
            width,
            aspectRatio: "8.5 / 11",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.paper",
            borderRadius: 1,
            cursor: onClick ? "pointer" : "default",
            border: "1px solid",
            borderColor: "divider",
          }}
          onClick={onClick}
        >
          <AudioFileOutlinedIcon />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width,
          aspectRatio: "8.5 / 11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
          borderRadius: 1,
          cursor: onClick ? "pointer" : "default",
          border: "1px solid",
          borderColor: "divider",
        }}
        onClick={onClick}
      >
        <IconForFileType fileType={iconFileType} />
      </Box>
    );
  }

  // PDF preflight failure → show placeholder immediately
  if (hasError) {
    return (
      <Box
        sx={{
          width,
          aspectRatio: "8.5 / 11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
          borderRadius: 1,
          cursor: onClick ? "pointer" : "default",
          border: "1px solid",
          borderColor: "divider",
        }}
        onClick={onClick}
      >
        <IconForFileType fileType={iconFileType} />
      </Box>
    );
  }

  // PDF loading
  if (!isLoaded || !Document || !Page) {
    return (
      <Box
        sx={{
          width,
          aspectRatio: "8.5 / 11",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  // (error case handled above)

  // PDF preview
  return (
    <Box
      sx={{
        position: "relative",
        width,
        aspectRatio: "8.5 / 11",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        borderRadius: 1,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s ease",
        "&:hover": onClick
          ? {
              borderColor: "primary.main",
              boxShadow: 2,
              transform: "scale(1.02)",
            }
          : {},
      }}
      onClick={onClick}
    >
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
          "& .react-pdf__Document": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          },
          "& .react-pdf__Page": {
            width: "100% !important",
            height: "100% !important",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          "& .react-pdf__Page__canvas": {
            width: "100% !important",
            height: "auto !important",
            maxHeight: "100%",
            objectFit: "contain",
          },
          "& .react-pdf__Page__textContent": {
            display: "none !important",
          },
          "& .react-pdf__Page__annotations": {
            display: "none !important",
          },
        }}
      >
        {hasError ? (
          <ErrorOutlineOutlined
            sx={{ fontSize: 20, color: "text.secondary" }}
          />
        ) : (
          <Document
            file={fileUrl}
            loading={<CircularProgress size={20} />}
            error={
              <ErrorOutlineOutlined
                sx={{ fontSize: 20, color: "text.secondary" }}
              />
            }
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            <Page
              pageNumber={1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </Box>
    </Box>
  );
};

export default DocumentThumbnail;
