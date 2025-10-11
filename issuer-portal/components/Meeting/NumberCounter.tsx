import { BNTypographyPair } from '@rolemodel/betanxt-design-system/components/BNTypographyPair'

import { useMediaQuery, useTheme } from '@mui/material'

export const NumberCounter = ({
  label,
  isPercent,
  suffix,
  endValue = 100,
  notation = 'compact',
  compactDisplay = 'short',
}: {
  isPercent?: boolean
  label?: string
  suffix?: string
  startValue?: number
  endValue?: number
  notation?: 'compact' | 'standard'
  compactDisplay?: 'short' | 'long'
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const safeEnd = Number.isFinite(Number(endValue)) ? Number(endValue) : 0

  const formatNumber = (value: number) => {
    const formatter = new Intl.NumberFormat('en-US', {
      notation,
      compactDisplay,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    const formatted = formatter.format(value)
    return `${formatted}${isPercent ? '%' : suffix ?? ''}`
  }

  return (
    <BNTypographyPair
      primary={{
        text: label ?? '',
        variant: 'body3',
        fontWeight: 500,
      }}
      secondary={{
        text: formatNumber(safeEnd),
        variant: 'h2',
        fontWeight: 700,
        sx: { fontVariantNumeric: 'tabular-nums' },
      }}
      direction="column"
      alignItems={isMobile ? 'flex-start' : 'flex-end'}
      spacing={0.5}
    />
  )
}
