'use client'

import React, { type ReactNode, createContext, useContext, useState } from 'react'

interface PhaseDrawerContextType {
  isOpen: boolean
  drawerOpen: boolean
  currentPhase: number | null
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  setPhase: (phase: number) => void
  onTaskClick: (taskId: string) => void
}

const PhaseDrawerContext = createContext<PhaseDrawerContextType | undefined>(undefined)

export const usePhaseDrawer = (): PhaseDrawerContextType => {
  const context = useContext(PhaseDrawerContext)
  if (!context) {
    throw new Error('usePhaseDrawer must be used within a PhaseDrawerProvider')
  }
  return context
}

interface PhaseDrawerProviderProps {
  children: ReactNode
}

export const PhaseDrawerProvider: React.FC<PhaseDrawerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<number | null>(null)

  const openDrawer = (): void => setIsOpen(true)
  const closeDrawer = (): void => setIsOpen(false)
  const toggleDrawer = (): void => setIsOpen(!isOpen)
  const setPhase = (phase: number): void => setCurrentPhase(phase)
  const onTaskClick = (_taskId: string): void => {
    // Handle task click logic here
  }

  const value = {
    isOpen,
    drawerOpen: isOpen,
    currentPhase,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setPhase,
    onTaskClick,
  }

  return (
    <PhaseDrawerContext.Provider value={value}>{children}</PhaseDrawerContext.Provider>
  )
}
