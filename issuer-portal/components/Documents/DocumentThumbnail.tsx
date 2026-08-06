"use client";

import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

import { ErrorOutlineOutlined } from "@mui/icons-material";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import { Box, CircularProgress } from "@mui/material";
import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";

import { pdfWorkerSource } from "@/lib/pdf-worker";
import {
  getFileExtension,
  getStoragePublicUrl,
  isStorageUrl,
} from "@/utils/documentUtils";

import DocumentThumbnailGenerator from "./DocumentThumbnailGenerator";

// Mirrors PDFViewer.tsx's dynamic-import pattern: react-pdf is heavy and
// only ever needed client-side, so it's code-split here instead of hand
// -rolled with a useState/useEffect pair.
const Document = dynamic(
  async () =>
    await import("react-pdf").then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSource;
      return mod.Document;
    }),
  { ssr: false, loading: () => <CircularProgress size={20} /> }
);

const Page = dynamic(
  async () => await import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// The canvas react-pdf renders to is sized in real pixels, then the CSS
// below scales it down to the thumbnail's display width. Rendering at a
// multiple of the display width — rather than 1:1 — keeps the page sharp
// on high-DPI screens instead of looking soft/blurry.
const THUMBNAIL_RENDER_SCALE = 3;

interface Props {
  readonly filePath?: string | null;
  readonly onClick?: () => void;
  readonly width?: number;
}

interface ThumbnailFrameProps {
  readonly width: number;
  readonly onClick?: () => void;
  readonly interactive?: boolean;
  readonly fontSize?: string;
  readonly children: React.ReactNode;
}

const ThumbnailFrame = ({
  width,
  onClick,
  interactive = true,
  fontSize,
  children,
}: ThumbnailFrameProps) => (
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
      ...(fontSize ? { fontSize } : {}),
      ...(interactive ? { cursor: onClick ? "pointer" : "default" } : {}),
    }}
    onClick={onClick}
  >
    {children}
  </Box>
);

interface PdfThumbnailPreviewProps {
  readonly width: number;
  readonly onClick?: () => void;
  readonly fileUrl: string;
  readonly hasError: boolean;
  readonly onLoadSuccess: (pdf: PDFDocumentProxy) => void;
  readonly onLoadError: (error: Error) => void;
}

const PdfThumbnailPreview = ({
  width,
  onClick,
  fileUrl,
  hasError,
  onLoadSuccess,
  onLoadError,
}: PdfThumbnailPreviewProps) => (
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
        <ErrorOutlineOutlined sx={{ fontSize: 20, color: "text.secondary" }} />
      ) : (
        <Document
          file={fileUrl}
          loading={<CircularProgress size={20} />}
          error={
            <ErrorOutlineOutlined
              sx={{ fontSize: 20, color: "text.secondary" }}
            />
          }
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
        >
          <Page
            pageNumber={1}
            width={width * THUMBNAIL_RENDER_SCALE}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      )}
    </Box>
  </Box>
);

const DocumentThumbnail = ({ filePath, onClick, width = 60 }: Props) => {
  const [hasError, setHasError] = useState(false);

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

  const onDocumentLoadSuccess = () => {
    setHasError(false);
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

  // No file path provided
  if (!fileUrl) {
    return (
      <ThumbnailFrame width={width} interactive={false} fontSize="10px">
        <IconForFileType fileType={iconFileType} />
      </ThumbnailFrame>
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
        <ThumbnailFrame width={width} onClick={onClick}>
          <AudioFileOutlinedIcon />
        </ThumbnailFrame>
      );
    }

    return (
      <ThumbnailFrame width={width} onClick={onClick}>
        <IconForFileType fileType={iconFileType} />
      </ThumbnailFrame>
    );
  }

  // PDF preflight failure → show placeholder immediately
  if (hasError) {
    return (
      <ThumbnailFrame width={width} onClick={onClick}>
        <IconForFileType fileType={iconFileType} />
      </ThumbnailFrame>
    );
  }

  // PDF preview
  return (
    <PdfThumbnailPreview
      width={width}
      onClick={onClick}
      fileUrl={fileUrl}
      hasError={hasError}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={onDocumentLoadError}
    />
  );
};

export default DocumentThumbnail;
