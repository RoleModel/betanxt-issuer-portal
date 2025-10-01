'use client'

import React, { useEffect, useRef, useState } from 'react'

import { Box, TextField, Typography } from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

interface FormFieldAreaProps {
  area: {
    id: string
    x: number
    y: number
    width: number
    height: number
    label?: string
    type?: 'text' | 'date'
    value?: string
  }
  onValueChange: (areaId: string, value: string) => void
}

export const FormFieldArea: React.FC<FormFieldAreaProps> = ({ area, onValueChange }) => {
  const [value, setValue] = useState(area.value || '')
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onValueChange(area.id, value)
  }

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      setValue(formattedDate)
      onValueChange(area.id, formattedDate)
    }
  }

  const renderField = () => {
    const baseStyles = {
      width: '100%',
      display: 'flex',
      height: '39.13px',
      padding: '8px 8px',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingBottom: '2px',
    }

    if (isEditing) {
      if (area.type === 'date') {
        return (
          <Box sx={baseStyles}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={value ? new Date(value) : null}
                onChange={handleDateChange}
                onClose={() => setIsEditing(false)}
                open={isEditing}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    variant: 'outlined',
                    sx: {
                      '& .MuiInputBase-root': {
                        backgroundColor: 'white',
                        fontSize: '14px',
                        color: 'black',
                        '&:before, &:after': { display: 'none' },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '14px',
                        padding: '8px 8px',
                        color: 'black',
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        )
      } else {
        return (
          <Box sx={baseStyles}>
            <TextField
              ref={inputRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              variant="outlined"
              size="small"
              fullWidth
              autoFocus
              placeholder={area.label || 'Enter text'}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'white',
                  fontSize: '14px',
                  color: 'black',
                  '&:before, &:after': { display: 'none' },
                },
                '& .MuiInputBase-input': {
                  fontSize: '14px',
                  padding: '8px 8px',
                  color: 'black',
                },
              }}
            />
          </Box>
        )
      }
    }

    return (
      <Box
        onClick={handleClick}
        sx={{
          ...baseStyles,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: value ? 'black' : 'rgba(0, 0, 0, 0.7)',
            fontSize: '14px',
            lineHeight: '16px',
            height: '16px',
            userSelect: 'none',
            fontStyle: 'normal',
            width: '100%',
            paddingInline: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',

            textOverflow: 'ellipsis',
          }}
        >
          {value || area.label || 'Click to enter'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${area.x}%`,
        top: `${area.y}%`,
        width: `${area.width}%`,
        height: `${area.height}%`,
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        zIndex: 10,
        padding: 0,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {renderField()}
    </Box>
  )
}
