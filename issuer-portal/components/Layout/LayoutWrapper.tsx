'use client'

import { BNAppFooter } from '@rolemodel/betanxt-design-system/components/BNAppFooter'
import { motion } from 'framer-motion'
import React, { Suspense } from 'react'

import { Box, LinearProgress } from '@mui/material'

import { BNAppBarClient } from '@/components/BNAppBarWrapper'
import { EventTabs } from '@/components/EventTabs'
import IssuerSpeedDial from '@/components/SpeedDial'
import PhaseDrawer from '@/components/drawers/PhaseDrawer'

import { PhaseDrawerProvider, usePhaseDrawer } from '@/contexts/PhaseDrawerContext'

interface LayoutWrapperProps {
  children: React.ReactNode
}

const LayoutContent: React.FC<LayoutWrapperProps> = ({ children }) => {
  const { drawerOpen, currentPhase, closeDrawer, setPhase, onTaskClick } =
    usePhaseDrawer()
  const [isCalendarFullscreen, setIsCalendarFullscreen] = React.useState(false)

  React.useEffect(() => {
    const handleFullscreenChange = (event: CustomEvent) => {
      setIsCalendarFullscreen(event.detail.isFullscreen)
    }

    window.addEventListener(
      'calendar-fullscreen-change',
      handleFullscreenChange as EventListener
    )

    return () => {
      window.removeEventListener(
        'calendar-fullscreen-change',
        handleFullscreenChange as EventListener
      )
    }
  }, [])

  return (
    <Box
      component={motion.div}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      {/* Header */}
      {!isCalendarFullscreen && (
        <Box
          component={motion.div}
          layoutId="header"
          initial={{ height: 'auto' }}
          animate={{
            height: isCalendarFullscreen ? 0 : 'auto',
            opacity: isCalendarFullscreen ? 0 : 1,
          }}
          transition={{
            type: 'tween',
            duration: 0.2,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1200,
            overflow: 'hidden', // Important for height animation
          }}
        >
          <BNAppBarClient color="secondary" />

          {/* Event Tabs */}
          <nav id="navigation" role="navigation" aria-label="Meeting sections">
            <EventTabs />
          </nav>
        </Box>
      )}
      {/* Main Content */}
      <Box
        component="main"
        id="main-content"
        role="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Suspense
          fallback={
            <LinearProgress
              sx={{
                height: 4,
                position: 'sticky',
                top: 0,
                zIndex: 1100,
              }}
            />
          }
        >
          {children}
        </Suspense>
      </Box>

      {!isCalendarFullscreen && (
        <Box
          component={motion.div}
          layoutId="footer"
          initial={{ height: 'auto' }}
          animate={{
            height: isCalendarFullscreen ? 0 : 'auto',
            opacity: isCalendarFullscreen ? 0 : 1,
          }}
          transition={{
            type: 'tween',
            duration: 0.2,
            ease: 'easeInOut',
          }}
          sx={{ overflow: 'hidden' }}
        >
          <BNAppFooter />
        </Box>
      )}

      {/* Temporary FAB to test Phase Drawer */}
      <IssuerSpeedDial />

      {/* Phase Drawer */}
      <PhaseDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        phase={currentPhase}
        onPhaseChange={setPhase}
        onTaskClick={onTaskClick}
      />
    </Box>
  )
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  return (
    <PhaseDrawerProvider>
      <LayoutContent>{children}</LayoutContent>
    </PhaseDrawerProvider>
  )
}

export default LayoutWrapper
