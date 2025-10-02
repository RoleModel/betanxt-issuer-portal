import type React from 'react'

export type LayoutRoutes = '/[clientTicker]/meeting'

export type ParamMap = {
  '/[clientTicker]/meeting': {
    clientTicker: string
  }
}

export type LayoutSlotMap = {
  '/[clientTicker]/meeting': never
}

export type LayoutProps<LayoutRoute extends LayoutRoutes> = {
  params: Promise<ParamMap[LayoutRoute]>
  children: React.ReactNode
} & { [K in LayoutSlotMap[LayoutRoute]]: React.ReactNode }

export type ExtractLayoutParams<Route extends LayoutRoutes> = ParamMap[Route]
