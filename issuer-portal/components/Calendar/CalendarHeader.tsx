/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

'use client'

import React, { useState } from 'react'

import {
  AddOutlined as AddIcon,
  CalendarViewDay as CalendarViewDayIcon,
  CalendarMonthOutlined as MonthIcon,
  SearchOutlined as SearchIcon,
  ShareOutlined as ShareIcon,
  ZoomInMapOutlined as ZoomInMapOutlinedIcon,
  ZoomOutMapOutlined as ZoomOutMapOutlinedIcon,
} from '@mui/icons-material'
import {
  Box,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

/**
 * CalendarHeader component with view toggle, filters, and search functionality
 * Provides controls for switching between month and list views
 */

export type CalendarViewType = 'month' | 'list'

interface CalendarHeaderProps {
  view: CalendarViewType
  onViewChange: (view: CalendarViewType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  phaseFilter: number | null
  onPhaseFilterChange: (phase: number | null) => void
}

interface CalendarHeaderPropsInternal extends CalendarHeaderProps {
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  onAddClick?: () => void
}

export const CalendarHeader: React.FC<CalendarHeaderPropsInternal> = ({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  isFullscreen = false,
  onFullscreenToggle,
  onAddClick,
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false)

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded)
    if (searchExpanded && searchQuery) {
      onSearchChange('')
    }
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        px: 3,
        py: 2,
        background: theme.vars?.palette?.appBarPrimary?.defaultFill,
        color: theme.vars?.palette?.appBarPrimary?.defaultContrast,
        borderRadius: '4px 4px 0px 0px',
        position: isFullscreen ? 'relative' : 'sticky',
        top: isFullscreen ? 0 : undefined,
        zIndex: 1000,
      })}
    >
      {/* Main header row */}
      <Box
        display="flex"
        gap={1}
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent={{ xs: 'stretch', sm: 'space-between' }}
      >
        <Box flex="1">
          <Typography variant="h3" fontWeight={700} color="inherit">
            Meeting Calendar
          </Typography>
          <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
            Annual Meeting
          </Typography>
        </Box>

        <Box
          display="flex"
          flex="1"
          justifyContent="flex-end"
          alignItems="center"
          gap={1.5}
        >
          {/* Search */}
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleSearchToggle}
              aria-label={searchExpanded ? 'Close search' : 'Open search'}
              sx={{
                color: 'white',
                p: 1,
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <SearchIcon fontSize="medium" />
            </IconButton>

            <Collapse
              in={searchExpanded}
              orientation="horizontal"
              sx={{
                position: 'absolute',
                right: 0,
                zIndex: 10,
              }}
            >
              <TextField
                size="small"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus={searchExpanded}
                onBlur={() => {
                  if (!searchQuery) {
                    setSearchExpanded(false)
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          fontSize="medium"
                          sx={{
                            color: (theme) =>
                              theme.vars?.palette?.appBarPrimary?.defaultContrast,
                          }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: 250,
                  ml: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: (theme) =>
                      theme.vars?.palette?.appBarPrimary?.defaultFill,
                    color: 'black',
                    fontSize: '0.875rem',
                    height: 40,
                    '& fieldset': {
                      borderColor: 'white',
                      borderWidth: 1,
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: (theme) => theme.vars?.palette?.appBarPrimary?.defaultContrast,
                    '&::placeholder': {
                      color: 'rgba(var(--palette-common-white) / 0.6)',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Collapse>
          </Box>

          {/* View toggle */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => {
              if (newView) onViewChange(newView)
            }}
            aria-label="calendar view"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              height: 40,
              '& .MuiToggleButton-root': {
                color: 'white',
                borderColor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.7)',
                '&.Mui-selected': {
                  background: (theme) => theme.vars?.palette?.secondary?.main,
                  color: 'white',
                  '&:hover': {
                    background: (theme) => theme.vars?.palette?.secondary?.dark,
                  },
                },
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              },
            }}
          >
            <ToggleButton value="month" aria-label="month view">
              <MonthIcon fontSize="medium" />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <CalendarViewDayIcon fontSize="medium" />
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Action buttons */}
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              component="button"
              onClick={onAddClick}
              aria-label="Add new task"
              sx={{
                p: 1,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <AddIcon fontSize="medium" />
            </Box>
            <Box
              component="button"
              aria-label="Share calendar"
              sx={{
                p: 1,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ShareIcon fontSize="medium" />
            </Box>
            <Box
              component="button"
              onClick={onFullscreenToggle}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              sx={{
                p: 1,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {isFullscreen ? (
                <ZoomInMapOutlinedIcon fontSize="medium" />
              ) : (
                <ZoomOutMapOutlinedIcon fontSize="medium" />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default CalendarHeader
