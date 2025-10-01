import React from 'react'

import {
  Check as CheckIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'

import type { FilePreviewProps } from './types'

const BNFilePreview: React.FC<FilePreviewProps> = ({
  file,
  onRemove,
  disabled = false,
  dsmDocumentOptions = [],
  onAssociationChange,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onRemove(file.id)
  }

  const handleAssociationChange = (documentId: string) => {
    if (onAssociationChange) {
      onAssociationChange(file.id, documentId)
    }
  }

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return (
          <CircularProgress
            size={32}
            sx={(theme) => ({ color: theme.vars.palette.primary.main })}
            value={file.progress || 0}
            variant={file.progress !== undefined ? 'determinate' : 'indeterminate'}
          />
        )
      case 'complete':
        return (
          <Avatar
            sx={(theme) => ({
              width: 24,
              height: 24,
              background: theme.vars.palette.success.main,
            })}
          >
            <CheckIcon
              sx={(theme) => ({
                width: 16,
                height: 16,
                color: theme.vars.palette.common.white,
              })}
            />
          </Avatar>
        )
      case 'error':
        return (
          <Avatar
            sx={(theme) => ({
              width: 24,
              height: 24,
              background: theme.vars.palette.error.main,
            })}
          >
            <ErrorIcon
              sx={(theme) => ({
                width: 16,
                height: 16,
                color: theme.vars.palette.common.white,
              })}
            />
          </Avatar>
        )
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Uploading'
      case 'complete':
        return 'Complete'
      case 'error':
        return file.error || 'Error'
      default:
        return ''
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* File Icon */}
      <Avatar
        sx={{
          width: 40,
          height: 40,
          background: 'transparent',
          border: 'none',
        }}
      >
        <UploadFileIcon
          fontSize="medium"
          sx={(theme) => ({ color: theme.vars.palette.primary.main })}
        />
      </Avatar>

      {/* File Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body3"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.file.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="body3" sx={{ color: 'text.secondary' }}>
            {formatFileSize(file.file.size)}
          </Typography>
          <Typography variant="body3" sx={{ color: 'text.secondary' }}>
            •
          </Typography>
          <Typography
            variant="body3"
            sx={{
              color: file.status === 'error' ? 'error.main' : 'text.secondary',
            }}
          >
            {getStatusText()}
          </Typography>
        </Stack>

        {/* DSM Document Association Dropdown */}
        {dsmDocumentOptions.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <FormControl size="small" fullWidth>
              <Select
                value={file.associatedDocumentId || ''}
                onChange={(e) => handleAssociationChange(e.target.value)}
                displayEmpty
                aria-label="Select DSM Document"
                disabled={disabled}
              >
                <MenuItem value="">
                  <Typography variant="body3" sx={{ color: 'text.secondary' }}>
                    Select DSM Document
                  </Typography>
                </MenuItem>
                {dsmDocumentOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    <Typography variant="body3">{option.title}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Status Icon and Progress */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {file.status === 'uploading' && <Box position="relative">{getStatusIcon()}</Box>}

        {(file.status === 'complete' || file.status === 'error') && getStatusIcon()}

        {/* Delete Button */}
        <IconButton
          aria-label="Remove file"
          onClick={handleRemoveClick}
          disabled={disabled}
          size="small"
          sx={(theme) => ({
            color: theme.vars.palette.action.active,
            '&:hover': {
              color: theme.vars.palette.error.main,
            },
          })}
        >
          <DeleteIcon sx={{ width: 20, height: 20 }} />
        </IconButton>
      </Box>
    </Paper>
  )
}

export default BNFilePreview
