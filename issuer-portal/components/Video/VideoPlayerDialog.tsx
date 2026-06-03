"use client";

import { Close } from "@mui/icons-material";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import React from "react";

import VideoPlayer from "./VideoPlayer";

interface VideoPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  src?: string;
  title?: string;
  description?: string;
  poster?: string;
  seriesNumber?: string;
}

export default function VideoPlayerDialog({
  open,
  onClose,
  src,
  title,
  description,
  poster,
  seriesNumber,
}: VideoPlayerDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent
        sx={{
          p: 2,
          position: "relative",
          backgroundColor: (theme) => theme.vars.palette.common.black,
          "&:hover .MuiIconButton-root": {
            visibility: "visible",
            opacity: 1,
          },
        }}
      >
        <IconButton
          aria-label="Close Video"
          onClick={onClose}
          sx={{
            transition: (theme) => theme.transitions.create("opacity"),
            opacity: { xs: 1, md: 0 },
            visibility: { xs: "visible", md: "hidden" },
            color: (theme) => theme.vars.palette.grey[500],
            backgroundColor: (theme) => theme.vars.palette.common.black,
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 100,
          }}
        >
          <Close />
        </IconButton>
        <VideoPlayer
          src={src}
          title={title}
          description={description}
          poster={poster}
          seriesNumber={seriesNumber}
        />
      </DialogContent>
    </Dialog>
  );
}
