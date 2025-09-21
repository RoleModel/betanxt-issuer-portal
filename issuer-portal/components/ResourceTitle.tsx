'use client'

import React from 'react'

import { DescriptionOutlined } from '@mui/icons-material'
import { Box, Link, Paper, Typography } from '@mui/material'

interface ResourceTitleProps {
  title: string
  description: string
  actionText: string
  icon?: React.ReactNode
  onClick?: () => void
}

const ResourceTitle: React.FC<ResourceTitleProps> = ({
  title,
  description,
  actionText,
  icon,
  onClick,
}) => {
  return (
    <Box
      className="resource-card"
      sx={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', gap: 0.5 }}
    >
      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          cursor: 'pointer',
          backgroundColor: (theme) => theme.vars.palette.background.default,
          transition: (theme) =>
            theme.transitions.create(['transform', 'background-color']),
          '&:hover': {
            transform: 'translateY(-1px)',
            backgroundColor: (theme) => theme.vars.palette.background.paper,
          },
        }}
        onClick={onClick}
      >
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              aspectRatio: '8.5 / 11',
              margin: '0 auto',
              backgroundColor: (theme) => theme.vars.palette.tableCellRow.fill,
              borderRadius: 1,
              border: '1px solid',
              borderColor: (theme) => theme.vars.palette.divider,
            }}
          >
            {icon && (
              <Box
                sx={{
                  color: (theme) => theme.vars.palette.text.primary,
                }}
              >
                <DescriptionOutlined color="inherit" fontSize="large" />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          px: 1,
        }}
      >
        <Typography
          noWrap
          variant="body2"
          sx={{
            fontWeight: 600,
            color: (theme) => theme.vars.palette.text.primary,
          }}
        >
          {title}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>

        <Link
          sx={{
            alignSelf: 'flex-start',
            minWidth: 'auto',
            minHeight: 'auto',
          }}
        >
          {actionText}
        </Link>
      </Box>
    </Box>
  )
}

export default ResourceTitle
