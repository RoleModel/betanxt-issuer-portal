"use client";

import { Box, Divider, Stack } from "@mui/material";
import React from "react";

import VideoThumbnail from "./VideoThumbnail";

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  seriesNumber: string;
  thumbnail?: string;
  duration?: string;
  src?: string;
}

interface VideoPlaylistProps {
  readonly videos: VideoItem[];
  readonly activeVideoId?: string;
  readonly playingVideoId?: string;
  readonly onVideoSelect: (video: VideoItem) => void;
}

const VideoPlaylist = ({
  videos,
  activeVideoId,
  playingVideoId,
  onVideoSelect,
}: VideoPlaylistProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        // Calculate aspect ratio to match video player height
        // Video player: 8/12 columns with 16:9 ratio
        // Playlist: 4/12 columns, so needs 8:9 ratio to match height
        aspectRatio: 8 / 9, // Adjusted for column width difference (4 cols vs 8 cols)
        backgroundColor: (theme) => theme.vars.palette.background.default,
        borderRadius: 1,
        border: 1,
        borderColor: (theme) => theme.vars.palette.divider,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          px: 2,
          py: 2,
        }}
      >
        <Stack spacing={1} divider={<Divider />}>
          {videos.map((video) => (
            <VideoThumbnail
              key={video.id}
              title={video.title}
              description={video.description}
              seriesNumber={video.seriesNumber}
              thumbnail={video.thumbnail}
              duration={video.duration}
              onClick={() => {
                onVideoSelect(video);
              }}
              isActive={video.id === activeVideoId}
              isPlaying={video.id === playingVideoId}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default VideoPlaylist;
