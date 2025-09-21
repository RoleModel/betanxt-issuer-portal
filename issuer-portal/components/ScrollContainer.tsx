'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Box, styled } from '@mui/material'

interface ScrollContainerProps {
  children: React.ReactNode
  direction?: 'horizontal' | 'vertical' | 'both'
  height?: string | number
  width?: string | number
  className?: string
  sx?: object
}

const StyledScrollContainer = styled(Box, {
  shouldForwardProp: (prop) =>
    !['scrollDirection', 'showStartShadow', 'showEndShadow'].includes(prop as string),
})<{
  scrollDirection: 'horizontal' | 'vertical' | 'both'
  showStartShadow: boolean
  showEndShadow: boolean
}>(({ theme, scrollDirection, showStartShadow, showEndShadow }) => {
  const isVertical = scrollDirection === 'vertical' || scrollDirection === 'both'
  const isHorizontal = scrollDirection === 'horizontal' || scrollDirection === 'both'

  return {
    position: 'relative',
    overflow: 'hidden',

    // Main scroll container
    '& .scroll-content': {
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },

    // Vertical scroll shadows
    ...(isVertical && {
      '& .scroll-content::before, & .scroll-content::after': {
        content: '""',
        display: 'block',
        position: 'sticky',
        left: 0,
        right: 0,
        height: '12px',
        pointerEvents: 'none',
        zIndex: 1,
        transition: 'opacity 0.2s ease-in-out',
      },

      '& .scroll-content::before': {
        top: 0,
        background: `radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.10), transparent)`,
        opacity: showStartShadow ? 1 : 0,
        ...theme.applyStyles('dark', {
          background: `radial-gradient(farthest-side at 50% 0, rgba(255, 255, 255, 0.10), transparent)`,
        }),
      },

      '& .scroll-content::after': {
        bottom: 0,
        background: `radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.10), transparent)`,
        opacity: showEndShadow ? 1 : 0,
        ...theme.applyStyles('dark', {
          background: `radial-gradient(farthest-side at 50% 100%, rgba(255, 255, 255, 0.10), transparent)`,
        }),
      },
    }),

    // Horizontal scroll shadows
    ...(isHorizontal && {
      '&::before, &::after': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: '-10%',
        bottom: 0,
        width: '12px',
        pointerEvents: 'none',
        zIndex: 1,
        transition: 'opacity 0.2s ease-in-out',
      },

      '&::before': {
        left: 0,
        background: `radial-gradient(ellipse farthest-corner at left center, rgba(0, 0, 0, 0.10) 0%, transparent 75%)`,
        opacity: showStartShadow ? 1 : 0,
        ...theme.applyStyles('dark', {
          background: `radial-gradient(ellipse farthest-corner at left center, rgba(255, 255, 255, 0.10) 0%, transparent 75%)`,
        }),
      },

      '&::after': {
        right: 0,
        background: `radial-gradient(ellipse farthest-corner at right center, rgba(0, 0, 0, 0.10) 0%, transparent 60%)`,
        opacity: showEndShadow ? 1 : 0,
        ...theme.applyStyles('dark', {
          background: `radial-gradient(ellipse farthest-corner at right center, rgba(255, 255, 255, 0.10) 0%, transparent 60%)`,
        }),
      },
    }),
  }
})

const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  direction = 'vertical',
  height = '100%',
  className,
  sx,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showStartShadow, setShowStartShadow] = useState(false)
  const [showEndShadow, setShowEndShadow] = useState(false)

  const isVertical = direction === 'vertical' || direction === 'both'
  const isHorizontal = direction === 'horizontal' || direction === 'both'

  const updateShadows = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const threshold = 1 // pixels

    if (isHorizontal) {
      const canScrollLeft = element.scrollLeft > threshold
      const canScrollRight =
        element.scrollLeft < element.scrollWidth - element.clientWidth - threshold

      setShowStartShadow(canScrollLeft)
      setShowEndShadow(canScrollRight)
    }

    if (isVertical) {
      const canScrollUp = element.scrollTop > threshold
      const canScrollDown =
        element.scrollTop < element.scrollHeight - element.clientHeight - threshold
      setShowStartShadow(canScrollUp)
      setShowEndShadow(canScrollDown)
    }
  }, [isHorizontal, isVertical])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    // Initial check with a slight delay to ensure content is rendered
    const timer = setTimeout(() => {
      updateShadows()
    }, 100)

    // Add scroll listener
    element.addEventListener('scroll', updateShadows, { passive: true })

    // Add resize observer to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateShadows, 10)
    })
    resizeObserver.observe(element)

    return () => {
      clearTimeout(timer)
      element.removeEventListener('scroll', updateShadows)
      resizeObserver.disconnect()
    }
  }, [isVertical, isHorizontal, updateShadows])

  return (
    <StyledScrollContainer
      scrollDirection={direction}
      showStartShadow={showStartShadow}
      showEndShadow={showEndShadow}
      className={className}
      sx={{
        ...sx,
      }}
    >
      <Box
        ref={scrollRef}
        className="scroll-content"
        sx={{
          ...(isHorizontal && {
            overflowX: 'auto',
            overflowY: 'hidden',
            width: '100%',
            height: 'auto',
          }),
          ...(isVertical && {
            overflowY: 'auto',
            overflowX: 'hidden',
            height: height === '100%' ? '100%' : height,
            width: '100%',
          }),
        }}
      >
        {children}
      </Box>
    </StyledScrollContainer>
  )
}

export default ScrollContainer
