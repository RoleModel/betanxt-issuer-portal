'use client'

import React, { createContext, useContext } from 'react'

type AxisConfig = Record<string, unknown>
type SeriesConfig = Record<string, unknown>

export interface ChartDataContextValue {
  series: SeriesConfig[]
  xAxis?: AxisConfig[]
  yAxis?: AxisConfig[]
}

const ChartDataContext = createContext<ChartDataContextValue | undefined>(undefined)

export const ChartDataProvider: React.FC<{
  value: ChartDataContextValue
  children: React.ReactNode
}> = ({ value, children }) => {
  return <ChartDataContext.Provider value={value}>{children}</ChartDataContext.Provider>
}

export const useChartData = (): ChartDataContextValue => {
  const ctx = useContext(ChartDataContext)
  if (!ctx) {
    throw new Error('useChartData must be used within a ChartDataProvider')
  }
  return ctx
}
