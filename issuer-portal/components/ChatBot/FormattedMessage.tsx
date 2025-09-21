import React from 'react'

import { Box, Typography } from '@mui/material'

interface FormattedMessageProps {
  content: string
  variant?: 'body1' | 'body2'
}

export function FormattedMessage({ content, variant = 'body2' }: FormattedMessageProps) {
  // Split content into paragraphs based on double line breaks
  const paragraphs = content.split(/\n\s*\n/).filter((para) => para.trim())

  // If it's just one paragraph, check for single line breaks
  const formatContent = (text: string) => {
    // Split by single line breaks and create separate lines
    const lines = text.split('\n').filter((line) => line.trim())

    if (lines.length === 1) {
      return <Typography variant={variant}>{text.trim()}</Typography>
    }

    return (
      <Box>
        {lines.map((line, index) => (
          <Typography
            key={index}
            variant={variant}
            sx={{ mb: index < lines.length - 1 ? 0.5 : 0 }}
          >
            {line.trim()}
          </Typography>
        ))}
      </Box>
    )
  }

  // Handle bullet points (lines starting with - or *)
  const formatBulletPoints = (text: string) => {
    const lines = text.split('\n')
    const formattedLines: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (line.startsWith('- ') || line.startsWith('* ')) {
        formattedLines.push(
          <Typography
            key={i}
            variant={variant}
            component="li"
            sx={{
              listStyleType: 'disc',
              ml: 2,
              mb: 0.25,
            }}
          >
            {line.substring(2)}
          </Typography>
        )
      } else if (line) {
        formattedLines.push(
          <Typography key={i} variant={variant} sx={{ mb: 0.5 }}>
            {line}
          </Typography>
        )
      }
    }

    return <Box>{formattedLines}</Box>
  }

  // Handle numbered lists (lines starting with numbers)
  const formatNumberedList = (text: string) => {
    const lines = text.split('\n')
    const formattedLines: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const numberMatch = line.match(/^(\d+)\.\s*(.+)/)

      if (numberMatch) {
        formattedLines.push(
          <Typography
            key={i}
            variant={variant}
            component="li"
            sx={{
              listStyleType: 'decimal',
              ml: 2,
              mb: 0.25,
            }}
          >
            {numberMatch[2]}
          </Typography>
        )
      } else if (line) {
        formattedLines.push(
          <Typography key={i} variant={variant} sx={{ mb: 0.5 }}>
            {line}
          </Typography>
        )
      }
    }

    return <Box>{formattedLines}</Box>
  }

  // Check if content has bullet points or numbered lists
  const hasBulletPoints = content.includes('\n- ') || content.includes('\n* ')
  const hasNumberedList = /\n\d+\.\s/.test(content)

  if (paragraphs.length > 1) {
    // Multiple paragraphs
    return (
      <Box>
        {paragraphs.map((paragraph, index) => (
          <Box key={index} sx={{ mb: index < paragraphs.length - 1 ? 1.5 : 0 }}>
            {hasBulletPoints
              ? formatBulletPoints(paragraph)
              : hasNumberedList
                ? formatNumberedList(paragraph)
                : formatContent(paragraph)}
          </Box>
        ))}
      </Box>
    )
  } else {
    // Single paragraph or simple content
    const singleContent = paragraphs[0] || content

    if (hasBulletPoints) {
      return formatBulletPoints(singleContent)
    } else if (hasNumberedList) {
      return formatNumberedList(singleContent)
    } else {
      return formatContent(singleContent)
    }
  }
}
