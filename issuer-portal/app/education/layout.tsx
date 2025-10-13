'use client'

import React from 'react'

import { Box } from '@mui/material'

import { PageTitle } from '@/components/PageTitle'

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle>Education</PageTitle>
      <Box flexGrow={1}>{children}</Box>
    </>
  )
}
