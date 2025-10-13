'use client'

import React from 'react'

import { Box } from '@mui/material'

import { PageTitle } from '@/components/PageTitle'

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle>Products</PageTitle>
      <Box flexGrow={1}>{children}</Box>
    </>
  )
}
