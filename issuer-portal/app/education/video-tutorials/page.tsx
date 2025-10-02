'use client'

import React, { useState } from 'react'

import { Card, CardContent, Container, Grid } from '@mui/material'

import VideoPlayer from '@/components/Video/VideoPlayer'
import VideoPlaylist from '@/components/Video/VideoPlaylist'

interface VideoTutorial {
  id: string
  title: string
  description: string
  src?: string
  poster?: string
  thumbnail?: string
  duration: string
  seriesNumber: string
}

const videoTutorials: VideoTutorial[] = [
  {
    id: '1',
    title: 'Welcome to Your Issuer Portal',
    description: 'Overview tour of main navigation and dashboard',
    duration: '3:24',
    seriesNumber: '#1',
    poster: '/images/poster.png',
    thumbnail: '/images/video-thumbnail.png',
  },
  {
    id: '2',
    title: 'Managing Your Proxy Statement',
    description: 'How to upload and review your proxy statement',
    duration: '5:12',
    seriesNumber: '#2',
    poster: '/images/poster.png',
    thumbnail: '/images/video-thumbnail.png',
  },
  {
    id: '3',
    title: 'Document Review Process',
    description: 'Step-by-step guide to document approval workflow',
    duration: '4:38',
    seriesNumber: '#3',
    poster: '/images/poster.png',
    thumbnail: '/images/video-thumbnail.png',
  },
  {
    id: '4',
    title: 'Tabulation and Reporting',
    description: 'Understanding vote tabulation and generating reports',
    duration: '6:15',
    seriesNumber: '#4',
    poster: '/images/poster.png',
    thumbnail: '/images/video-thumbnail.png',
  },
  {
    id: '5',
    title: 'Calendar and Task Management',
    description: 'Using the calendar view to track important deadlines',
    duration: '3:52',
    seriesNumber: '#5',
    poster: '/images/poster.png',
    thumbnail: '/images/video-thumbnail.png',
  },
]

export default function VideoTutorialsPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const currentVideo = videoTutorials[currentVideoIndex]

  const handleVideoSelect = (video: { id: string }) => {
    const index = videoTutorials.findIndex((v) => v.id === video.id)
    setCurrentVideoIndex(index)
  }

  const handleVideoEnd = () => {
    // Auto-advance to next video
    if (currentVideoIndex < videoTutorials.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  return (
    <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            {/* Main video player */}
            <Grid size={{ xs: 12, md: 8 }}>
              <VideoPlayer
                src={currentVideo.src}
                title={currentVideo.title}
                description={currentVideo.description}
                poster={currentVideo.poster}
                seriesNumber={currentVideo.seriesNumber}
                onVideoEnd={handleVideoEnd}
              />
            </Grid>

            {/* Video playlist */}
            <Grid size={{ xs: 12, md: 4 }}>
              <VideoPlaylist
                videos={videoTutorials}
                activeVideoId={currentVideo.id}
                playingVideoId={currentVideo.id}
                onVideoSelect={handleVideoSelect}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  )
}
