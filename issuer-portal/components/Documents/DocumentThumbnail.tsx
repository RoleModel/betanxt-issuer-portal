'use client'

import React, { useMemo } from 'react'

import NoSim from '@mui/icons-material/NoSim'
import { Box, LinearProgress } from '@mui/material'

type Props = {
  filePath?: string | null
  onClick?: () => void
}

export default function DocumentThumbnail({ filePath, onClick }: Props) {
  const fileUrl = useMemo(() => {
    if (!filePath) return null
    return filePath
  }, [filePath])

  if (!fileUrl) {
    return (
      <Box
        sx={{
          width: 30,
          height: 40,
          maxHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1,
          fontSize: '10px',
        }}
      >
        <NoSim />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* TODO: Integrate PDF viewer preview */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1,
          zIndex: 1,
          width: 30,
          height: 40,
          maxHeight: 40,
        }}
      >
        <LinearProgress />
      </Box>
      <Box sx={{ width: 30, height: 40 }} />
    </Box>
  )
}
