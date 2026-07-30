"use client";

import { PlayArrow } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import React from "react";

interface VideoThumbnailProps {
  title: string;
  description?: string;
  seriesNumber?: string;
  thumbnail?: string;
  duration?: string;
  onClick?: () => void;
  isActive?: boolean;
  isPlaying?: boolean;
}

const VideoThumbnail = ({
  title,
  description,
  seriesNumber = "#1",
  thumbnail,
  duration,
  onClick,
  isActive = false,
  isPlaying = false,
}: VideoThumbnailProps) => {
  return (
    <Box
      className="video-list-item"
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1,
        borderRadius: 1,
        cursor: onClick ? "pointer" : "default",
        backgroundColor: isActive
          ? (theme) => `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`
          : "transparent",
        "&:hover": onClick
          ? {
              backgroundColor: (theme) => theme.vars.palette.action.hover,
            }
          : undefined,
        transition: "all 0.2s ease-in-out",
      }}
      role={onClick ? "button" : "presentation"}
      aria-label={onClick ? `Play ${title}` : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Thumbnail */}
      <Box
        className="video-thumbnail"
        sx={{
          position: "relative",
          width: 160,
          height: 90,
          borderRadius: 1,
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: (theme) => theme.vars.palette.grey[100],
          backgroundImage: thumbnail
            ? `url(${thumbnail})`
            : "linear-gradient(135deg, #032f3f 0%, #307987 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Background overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, transparent 20%, rgba(3, 47, 63, 0.6) 100%)",
          }}
        />

        {/* Series badge */}
        <Box
          className="video-series-badge"
          sx={(theme) => ({
            position: "absolute",
            top: 6.58,
            right: 8.22,
            backgroundColor: theme.vars.palette.primary.dark,
            borderRadius: 4,
            px: theme.spacing(1),
            py: theme.spacing(1),
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: "1.403px",
          })}
        >
          <Typography
            sx={{
              color: (theme) => theme.vars.palette.common.white,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 0,
            }}
          >
            {seriesNumber}
          </Typography>
        </Box>

        {/* Duration badge (if provided) */}
        {duration && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              right: 4,
              backgroundColor: (theme) => theme.vars.palette.primary.dark,
              borderRadius: 2,
              px: 0.5,
              py: 0.25,
              zIndex: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: (theme) => theme.vars.palette.common.white,
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {duration}
            </Typography>
          </Box>
        )}

        {/* Play button overlay */}
        {!isPlaying && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              backgroundColor: (theme) => theme.vars.palette.background.default,
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease-in-out",
              ...(onClick && {
                "&:hover": {
                  backgroundColor: (theme) => theme.vars.palette.common.white,
                  transform: "translate(-50%, -50%) scale(1.1)",
                },
              }),
            }}
          >
            <PlayArrow
              sx={{
                color: (theme) => theme.vars.palette.primary.main,
                fontSize: 24,
              }}
            />
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0, // Allow text to truncate
          py: 1,
          px: 0.5,
        }}
      >
        <Typography
          variant="body3"
          sx={{
            fontWeight: 500,
            fontSize: 14,
            mb: description ? 0.5 : 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body3"
            sx={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default VideoThumbnail;
