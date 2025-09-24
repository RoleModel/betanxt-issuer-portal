import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'

import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Box, Link, Paper, Typography } from '@mui/material'

import type { FileDropzoneProps } from './types'
import { DEFAULT_ACCEPTED_TYPES, DEFAULT_MAX_SIZE } from './types'

const BNFileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  onFileRejections,
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  multiple = true,
  linkText = 'Browse Files',
  hasUnsupportedFiles = false,
}) => {
  const handleDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles)
    },
    [onFilesSelected]
  )

  const handleDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      // Notify parent component about rejections
      if (onFileRejections) {
        onFileRejections(fileRejections)
      }
    },
    [onFileRejections]
  )

  const acceptObject = acceptedFileTypes.reduce(
    (acc, type) => {
      // Map file extensions to MIME types for proper drag & drop support
      switch (type) {
        case '.doc':
          acc['application/msword'] = ['.doc']
          break
        case '.docx':
          acc['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] =
            ['.docx']
          break
        case '.pdf':
          acc['application/pdf'] = ['.pdf']
          break
        case '.ppt':
          acc['application/vnd.ms-powerpoint'] = ['.ppt']
          break
        case '.pptx':
          acc[
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          ] = ['.pptx']
          break
        case '.xlsx':
          acc['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = [
            '.xlsx',
          ]
          break
        case '.xls':
          acc['application/vnd.ms-excel'] = ['.xls']
          break
        case '.csv':
          acc['text/csv'] = ['.csv']
          acc['application/csv'] = ['.csv']
          break
        default:
          // For any other file types, create a generic accept rule
          // This ensures drag & drop works for all specified file types
          if (!acc['*/*']) {
            acc['*/*'] = []
          }
          acc['*/*'].push(type)
          break
      }
      return acc
    },
    {} as Record<string, string[]>
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted: handleDropAccepted,
    onDropRejected: handleDropRejected,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    accept: acceptObject,
    disabled,
    multiple,
  })

  const formatFileTypes = (types: string[]) => {
    return types.map((type) => type.toUpperCase().replace('.', '')).join(', ')
  }

  const formatMaxSize = (size: number) => {
    const mb = size / (1024 * 1024)
    return `${mb}MB`
  }

  // Determine border and background colors based on state
  const getBorderColor = () => {
    if (hasUnsupportedFiles) return 'var(--mui-palette-error-main)' // Error red
    if (isDragActive) return 'primary.main'
    return 'error.main'
  }

  const getBackgroundColor = () => {
    if (hasUnsupportedFiles) return 'rgba(var(--mui-palette-error-mainChannel) / 0.04)' // Error red background
    if (isDragActive) return 'rgba(var(--mui-palette-primary-mainChannel) / 0.04)'
    return 'transparent'
  }

  const getIconColor = () => {
    if (hasUnsupportedFiles) return 'var(--mui-palette-error-main)' // Error red
    return 'primary.main'
  }

  const getHoverStyles = () => {
    if (disabled) return { background: 'transparent' }
    if (hasUnsupportedFiles) {
      return {
        border: `1px solid ${getBorderColor()}`,
        background: 'rgba(214, 57, 0, 0.04)',
      }
    }
    return {
      border: isDragActive ? `2px dashed primary.main` : `1px dashed primary.main`,
      background: `rgba(var(--mui-palette-primary-mainChannel) / 0.07)`,
    }
  }

  return (
    <Paper
      {...getRootProps()}
      variant="outlined"
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 3,
        border: hasUnsupportedFiles
          ? `1px solid ${getBorderColor()}`
          : isDragActive
            ? `2px dashed ${theme.vars.palette.divider}`
            : `1px dashed ${theme.vars.palette.divider}`,
        borderRadius: 1,
        borderColor: theme.vars.palette.primary.main,
        background: getBackgroundColor(),
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: theme.transitions.create(['background', 'border']),
        '&:hover': getHoverStyles(),
      })}
    >
      <input
        {...getInputProps()}
        aria-label={`Upload files. Accepted types: ${formatFileTypes(acceptedFileTypes)}. Maximum size: ${formatMaxSize(maxSize)}`}
      />

      <Box position="relative" borderRadius="100px">
        <Box position="absolute" top={2} left={2}>
          <UploadFileIcon fontSize="large" sx={{ color: getIconColor() }} />
        </Box>
        <Box width={40} height={40} sx={{ transform: 'rotate(-90deg)' }} />
      </Box>

      <Typography variant="body3">
        <Link
          underline="always"
          sx={{
            typography: 'body3',
            fontWeight: 500,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {linkText}
        </Link>
        &nbsp;or drag and drop
      </Typography>

      {hasUnsupportedFiles ? (
        <Typography color="var(--mui-palette-error-main)" variant="body3" align="center">
          Unsupported file.
        </Typography>
      ) : (
        <Typography color="text.secondary" variant="body3" align="center">
          {formatFileTypes(acceptedFileTypes)} (max {formatMaxSize(maxSize)})
        </Typography>
      )}
    </Paper>
  )
}

export default BNFileDropzone
