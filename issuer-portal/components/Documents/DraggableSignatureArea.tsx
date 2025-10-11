'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Box, Typography } from '@mui/material'

import { useSignatureAreas } from '@/hooks/useSignatureAreas'

interface SignatureArea {
  id: string
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage width
  height: number // percentage height
  page?: number // page number (default 1)
  label?: string // label for the signature area
  type?: 'signature' | 'text' | 'date' // field type
  signed?: boolean
  value?: string // for text/date fields
}

interface DraggableSignatureAreaProps {
  area: SignatureArea
  signatureData?: string
  documentId: string
  onClick: () => void
  onPositionUpdate?: (areaId: string, x: number, y: number) => void
}

export const DraggableSignatureArea: React.FC<DraggableSignatureAreaProps> = ({
  area,
  signatureData,
  documentId,
  onClick,
  onPositionUpdate,
}) => {
  const { createSignatureArea, updateSignatureArea, checkDocumentExists } =
    useSignatureAreas()
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: area.x, y: area.y })
  const [, setShowTooltip] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Hold shift to enable dragging
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)

      const parent = elementRef.current?.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        dragStartRef.current = {
          x: e.clientX - rect.left - (position.x / 100) * rect.width,
          y: e.clientY - rect.top - (position.y / 100) * rect.height,
        }
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const parent = elementRef.current?.parentElement
      if (parent) {
        const rect = parent.getBoundingClientRect()
        const newX = ((e.clientX - rect.left - dragStartRef.current.x) / rect.width) * 100
        const newY = ((e.clientY - rect.top - dragStartRef.current.y) / rect.height) * 100

        // Constrain to parent bounds
        setPosition({
          x: Math.max(0, Math.min(100 - area.width, newX)),
          y: Math.max(0, Math.min(100 - area.height, newY)),
        })
      }
    },
    [isDragging, area.width, area.height]
  )

  const handleMouseUp = useCallback(async () => {
    if (!isDragging) return

    setIsDragging(false)

    // Handle temporary signature areas by creating them in the database first
    if (area.id.startsWith('temp-')) {
      try {
        // First verify the document exists using hook
        const documentExists = await checkDocumentExists(documentId)
        if (!documentExists) {
          return
        }

        // Create signature area using hook
        const newSignatureArea = await createSignatureArea(documentId, {
          x_position: position.x,
          y_position: position.y,
          width: area.width,
          height: area.height,
          page_number: area.page || 1,
          label: area.label ?? 'signature',
        })

        if (newSignatureArea) {
          // Update the area ID to the new database ID for future operations
          onPositionUpdate?.(newSignatureArea.id, position.x, position.y)
        }
      } catch (err) {
        console.error('Failed to create signature area', err)
      }
      return
    }

    // Update position in database for existing signature areas
    try {
      const updatedArea = await updateSignatureArea(area.id, {
        x_position: position.x,
        y_position: position.y,
      })

      if (updatedArea) {
        onPositionUpdate?.(area.id, position.x, position.y)
      } else {
        // Failed to update position
      }
    } catch (err) {
      console.error('Failed to update signature area position', err)
    }
  }, [
    isDragging,
    position,
    area.id,
    area.page,
    area.width,
    area.height,
    area.label,
    documentId,
    onPositionUpdate,
    checkDocumentExists,
    createSignatureArea,
    updateSignatureArea,
  ])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleClick = (e: React.MouseEvent) => {
    if (!e.shiftKey && !isDragging) {
      onClick()
    }
  }

  const renderSignature = () => {
    if (!signatureData) {
      return (
        <Typography
          variant="body1"
          sx={[
            (theme) => ({
              color: theme.vars.palette.text.primary,
              textAlign: 'center',
              userSelect: 'none',
            }),
            (theme) =>
              theme.applyStyles('dark', {
                color: theme.vars.palette.info.dark,
              }),
          ]}
        >
          {area.label ?? 'Click to sign'}
        </Typography>
      )
    }

    // Handle typed signature
    if (signatureData.startsWith('data:application/json;base64,')) {
      try {
        const jsonData = atob(signatureData.split(',')[1])
        const signatureInfo = JSON.parse(jsonData)
        return (
          <Typography
            sx={{
              fontFamily: signatureInfo.font ?? 'cursive',
              fontSize: 20,
              fontWeight: 500,
              textAlign: 'center',
              color: 'text.primary',
              userSelect: 'none',
            }}
          >
            {signatureInfo.text}
          </Typography>
        )
      } catch {
        return null
      }
    }

    // Handle drawn signature
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundImage: `url(${signatureData})`,
          backgroundSize: '80%',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    )
  }

  return (
    <>
      <Box
        ref={elementRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        data-testid={`signature-area-${area.id}`}
        sx={{
          position: 'absolute',
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${area.width}%`,
          height: `${area.height}%`,
          backgroundColor: signatureData
            ? 'transparent'
            : isDragging
              ? 'rgba(255, 209, 102, 0.2)'
              : 'rgba(255, 209, 102, 0.5)',
          border: signatureData
            ? ''
            : isDragging
              ? '2px solid rgba(255, 209, 102, 1)'
              : '2px dashed rgba(255, 209, 102, 1)',
          borderRadius: 1,
          cursor: isDragging ? 'move' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isDragging ? 20 : 10,
          px: 3,
          transition: isDragging ? 'none' : 'all 0.2s ease-in-out',
          userSelect: 'none',
          boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
          '&:hover': {
            backgroundColor: signatureData
              ? 'rgba(255, 209, 102, 0.2)'
              : 'rgba(255, 209, 102, 0.0)',
            transform: isDragging ? 'none' : 'scale(1.02)',
            boxShadow: isDragging
              ? '0 4px 8px rgba(0,0,0,0.2)'
              : '0 2px 4px rgba(0,0,0,0.1)',
          },
        }}
      >
        {renderSignature()}
      </Box>

      {/* Position indicator during drag */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            left: `${position.x}%`,
            top: `${Math.max(0, position.y - 5)}%`,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            zIndex: 30,
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
          }}
        >
          X: {Math.round(position.x)}%, Y: {Math.round(position.y)}%
        </Box>
      )}
    </>
  )
}

export default DraggableSignatureArea
