'use client'

import HandClickIcon from '@rolemodel/betanxt-design-system/components/icons/brand/HandClickIcon'
import React from 'react'

import { Box, Paper, Stack, Typography } from '@mui/material'

interface EmptyStateProps {
  icon?: React.JSXElementConstructor<React.ComponentProps<typeof HandClickIcon>> // Keep generic due to BetaNXT icon prop types
  title: string
  description: string | React.ReactNode
  dangerouslySetInnerHTML?: boolean
}

export function EmptyState({
  icon: Icon = HandClickIcon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Paper
        elevation={0}
        sx={(theme) => ({
          background: theme.vars.palette.tableCellRow.fill,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        })}
      >
        <Stack
          spacing={1}
          alignItems="center"
          sx={{ maxWidth: 400, textAlign: 'center' }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon fontSize="4rem" sx={{ width: 64, height: 64 }} />
          </Box>

          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: 1.43,
              letterSpacing: '1.07%',
              color: 'text.primary',
              mt: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: 1.43,
              letterSpacing: '1.07%',
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            {description}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}

// Export types for external use
export type { EmptyStateProps }

// Also export as default for backward compatibility
export default EmptyState
