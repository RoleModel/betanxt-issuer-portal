'use client'

import React from 'react'

import { Box, Typography } from '@mui/material'

interface FormattedMessageProps {
  content: string
  variant?: 'body1' | 'body2'
}

export function FormattedMessage({ content, variant = 'body2' }: FormattedMessageProps) {
  const sanitizedContent = content.replaceAll('**', '').replaceAll('##', '')
  const paragraphs = sanitizedContent
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim())

  const renderParagraph = (paragraph: string) => {
    const bulletLines = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (bulletLines.every((line) => line.startsWith('- ') || line.startsWith('* '))) {
      return (
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {bulletLines.map((line) => (
            <Typography key={line} component="li" variant={variant} sx={{ mb: 0.5 }}>
              {line.slice(2)}
            </Typography>
          ))}
        </Box>
      )
    }

    return (
      <Box>
        {bulletLines.map((line) => (
          <Typography key={line} variant={variant} sx={{ mb: 0.5 }}>
            {line}
          </Typography>
        ))}
      </Box>
    )
  }

  return (
    <Box>
      {(paragraphs.length > 0 ? paragraphs : [sanitizedContent]).map(
        (paragraph, index) => (
          <Box
            key={`${paragraph}-${index}`}
            sx={{ mb: index === paragraphs.length - 1 ? 0 : 1.5 }}
          >
            {renderParagraph(paragraph)}
          </Box>
        )
      )}
    </Box>
  )
}
