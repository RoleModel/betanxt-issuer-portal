'use client'

import React from 'react'

import { LinearProgress } from '@mui/material'

export default function Loading() {
  return (
    <LinearProgress
      sx={{
        height: 4,
      }}
    />
  )
}
