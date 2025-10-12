'use client'

import React, { useRef, useState } from 'react'

import { Pause, PlayArrow, VolumeOff, VolumeUp } from '@mui/icons-material'
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material'

interface VideoPlayerProps {
  src?: string
  title?: string
  description?: string
  poster?: string
  seriesNumber?: string
  showSeries?: boolean
  showPlayButton?: boolean
  onVideoEnd?: () => void
}

export default function VideoPlayer({
  src,
  title = 'Welcome to Your Issuer Portal',
  description = 'Overview tour of main navigation and dashboard',
  poster,
  seriesNumber = '#1',
  showSeries = false,
  onVideoEnd,
  showPlayButton = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      void videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleSeek = (_: Event, newValue: number | number[]) => {
    if (!videoRef.current || Array.isArray(newValue)) return
    videoRef.current.currentTime = newValue
    setCurrentTime(newValue)
  }

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    if (!videoRef.current || Array.isArray(newValue)) return
    const volumeValue = newValue / 100
    videoRef.current.volume = volumeValue
    setVolume(volumeValue)
    setIsMuted(volumeValue === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    videoRef.current.muted = newMutedState
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
    onVideoEnd?.()
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        // height: 403,
        aspectRatio: 16 / 9,
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: (theme) => theme.vars.palette.common.white,
        backgroundImage: poster
          ? `url(${poster})`
          : `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 717 403"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23032f3f"/><stop offset="100%" style="stop-color:%23307987"/></linearGradient></defs><rect width="717" height="403" fill="url(%23bg)"/></svg>')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: src ? 'pointer' : 'default',
        '&:hover .video-controls': {
          opacity: 1,
        },
        '&:hover .video-play-button': {
          transform: 'translate(-50%, -50%) scale(1.2)',
          transformOrigin: 'center',
          transition: 'transform 0.2s ease-in-out',
        },
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
      onClick={src ? togglePlay : undefined}
      role={src ? 'button' : 'presentation'}
      aria-label={src ? 'Play video' : undefined}
    >
      {/* Background overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(3, 47, 63, 0) 0%, rgba(3, 47, 63, 1) 100%)',
        }}
      />

      {/* Additional opacity layer to match Figma */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}
      />

      {/* Video element */}
      {src && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnd}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          muted={isMuted}
          playsInline
        />
      )}

      {/* Play button overlay */}
      {!isPlaying && showPlayButton && (
        <Box
          className="video-play-button"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            cursor: 'pointer',
          }}
        >
          <IconButton
            onClick={src ? togglePlay : undefined}
            disabled={!src}
            sx={{
              width: 80,
              height: 80,
              backgroundColor: (theme) =>
                `rgb(${theme.vars.palette.common.backgroundChannel} / 0.9)`,
              color: (theme) => theme.vars.palette.primary.main,
              '&:hover': {
                backgroundColor: (theme) => theme.vars.palette.common.white,
                transform: 'scale(1.2)',
              },
              '&:disabled': {
                backgroundColor: (theme) =>
                  `rgba(${theme.vars.palette.common.backgroundChannel} / 0.5)`,
                color: (theme) => theme.vars.palette.text.disabled,
              },
            }}
            aria-label="Play video"
          >
            <PlayArrow sx={{ fontSize: 48 }} />
          </IconButton>
        </Box>
      )}

      {/* Video controls */}
      {src && (
        <Box
          className="video-controls"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, transparent 100%)',
            padding: 2,
            opacity: showControls || !isPlaying ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 3,
          }}
        >
          <Stack spacing={1}>
            {/* Progress slider */}
            <Slider
              value={currentTime}
              min={0}
              max={duration || 100}
              onChange={handleSeek}
              sx={{
                color: (theme) => theme.vars.palette.primary.main,
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                },
                '& .MuiSlider-track': {
                  height: 4,
                },
                '& .MuiSlider-rail': {
                  height: 4,
                  backgroundColor: (theme) =>
                    `rgba(${theme.vars.palette.common.backgroundChannel} / 0.3)`,
                },
              }}
              aria-label="Video progress"
            />

            {/* Control buttons */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                  sx={{ color: 'white' }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>

                <Typography variant="caption" sx={{ color: 'white', minWidth: 80 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleMute()
                  }}
                  sx={{ color: 'white' }}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>

                <Slider
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  sx={{
                    width: 80,
                    color: (theme) => theme.vars.palette.primary.main,
                    '& .MuiSlider-thumb': {
                      width: 8,
                      height: 8,
                    },
                    '& .MuiSlider-track': {
                      height: 2,
                    },
                    '& .MuiSlider-rail': {
                      height: 2,
                      backgroundColor: (theme) =>
                        `rgba(${theme.vars.palette.common.backgroundChannel} / 0.3)`,
                    },
                  }}
                  aria-label="Volume"
                />
              </Stack>
            </Stack>
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 24,
          right: 24,
          zIndex: 1,
          ...(src && isPlaying && { opacity: 0 }),
          transition: 'opacity 0.3s ease',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: (theme) => theme.vars.palette.common.white,
            fontFamily: 'Roboto Condensed',
            fontWeight: 500,
            fontSize: { xs: 24, sm: 32 },
            lineHeight: 1.1,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: (theme) => theme.vars.palette.common.white,
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {description}
        </Typography>
      </Box>

      {showSeries && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 6.58,
            left: 8.22,
            backgroundColor: theme.vars.palette.secondary.main,
            borderRadius: 4,
            px: theme.spacing(1),
            py: theme.spacing(1),
            zIndex: 2,
            boxShadow: '0px 0.506px 1.012px 0px rgba(68, 100, 214, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.403px',
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
      )}
    </Box>
  )
}
