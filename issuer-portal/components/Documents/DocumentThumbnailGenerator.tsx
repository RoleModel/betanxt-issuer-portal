"use client";

import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Box, Skeleton } from "@mui/material";
import { IconForFileType } from "@rolemodel/betanxt-design-system/components/icons/IconForFileType";
import React, { useEffect, useState } from "react";

interface DocumentThumbnailProps {
  url?: string;
  fileType?: string;
  title?: string;
  width?: number;
  height?: number;
}

const DocumentThumbnailGenerator: React.FC<DocumentThumbnailProps> = ({
  url,
  fileType,
  title,
  width = 40,
  height = 40,
}) => {
  const [loading, setLoading] = useState(true);
  const [, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    // For PDFs, we could potentially generate a thumbnail of the first page
    // For now, we'll use icon-based representations
    setLoading(false);
  }, [url]);

  // Get appropriate icon based on file type
  const getFileIcon = () => {
    const ext = fileType?.toLowerCase();
    const iconProps = { sx: { fontSize: 30, color: "text.secondary" } };

    switch (ext) {
      case "pdf":
        return <IconForFileType fileType="PDF" {...iconProps} />;
      case "doc":
      case "docx":
        return <IconForFileType fileType="PDF" {...iconProps} />;
      case "xls":
      case "xlsx":
        return <IconForFileType fileType="XLS" {...iconProps} />;
      case "ppt":
      case "pptx":
        return <IconForFileType fileType="PDF" {...iconProps} />;
      case "mp4":
      case "m4a":
        return <AudioFileOutlinedIcon {...iconProps} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <ImageIcon {...iconProps} />;
      default:
        return <InsertDriveFileIcon {...iconProps} />;
    }
  };

  // For images, we can show the actual image as thumbnail
  const isImage = ["jpg", "jpeg", "png", "gif", "svg"].includes(fileType?.toLowerCase() || "");

  if (loading) {
    return <Skeleton variant="rectangular" width={width} height={height} />;
  }

  return (
    <Box
      sx={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "background.paper",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {isImage && url ? (
        <Box
          component="img"
          src={url}
          alt={title ?? "Document thumbnail"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={() => setThumbnailUrl(null)}
        />
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {getFileIcon()}
        </Box>
      )}
    </Box>
  );
};

export default DocumentThumbnailGenerator;
