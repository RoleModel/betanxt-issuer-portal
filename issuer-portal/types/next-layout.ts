import type React from 'react'

export type LayoutRoutes = '/[clientTicker]/meeting'

export interface ParamMap {
  '/[clientTicker]/meeting': {
    clientTicker: string
  }
}

export interface LayoutSlotMap {
  '/[clientTicker]/meeting': never
}

export type LayoutProps<LayoutRoute extends LayoutRoutes> = {
  params: Promise<ParamMap[LayoutRoute]>
  children: React.ReactNode
} & Record<LayoutSlotMap[LayoutRoute], React.ReactNode>

export type ExtractLayoutParams<Route extends LayoutRoutes> = ParamMap[Route]
