import { AnimateNumber, AnimateNumberProps } from 'motion-plus/react'
import { LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Box, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

const Container = styled('div')<{ $align?: 'start' | 'center' | 'end' }>(({ theme, $align }) => ({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: $align === 'start' ? 'flex-start' : $align === 'center' ? 'center' : 'flex-end',
  justifyContent: $align === 'start' ? 'flex-start' : $align === 'center' ? 'center' : 'flex-end',
  whiteSpace: 'nowrap',
  flex: 1,
  textAlign: 'left',
  [theme.breakpoints.up('md')]: {
    flex: 0,
    textAlign: 'right',
  },
}))

const NumberText = styled(Box)(({ theme }) => ({
  ...theme.typography.h2,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 700,
}))

const numberStyle = {
  alignItems: 'baseline',
  font: 'var(--mui-font-h2)',
  fontVariantNumeric: "tabular-nums",
}

export const NumberCounter = ({
  label,
  isPercent,
  suffix,
  startValue = 0,
  endValue = 100,
  align = 'end',
  notation = 'compact',
  compactDisplay = 'short',
}: {
  isPercent?: boolean
  label?: string
  suffix?: string
  startValue?: number
  endValue?: number
  align?: 'start' | 'center' | 'end'
  notation?: 'compact' | 'standard'
  compactDisplay?: 'short' | 'long'
}) => {
  const safeStart = Number.isFinite(Number(startValue)) ? Number(startValue) : 0
  const safeEnd = Number.isFinite(Number(endValue)) ? Number(endValue) : 0
  const [value, setValue] = useState<number>(safeStart)

  useEffect(() => {
    const timer = setTimeout(() => {
      setValue(safeEnd)
    }, 500) // Small delay before starting animation

    return () => clearTimeout(timer)
  }, [safeEnd])



  return (
    <LayoutGroup>
      <motion.div layout>
        <Container $align={align}>
          {label && (
            <Typography variant="body2" component="span" fontWeight={500} display="block">
              {label}
            </Typography>
          )}
          <NumberText>
            <AnimateNumber
              format={{
                notation,
                compactDisplay,
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              } as AnimateNumberProps['format']}
              suffix={isPercent ? '%' : suffix}
              style={numberStyle}
            >
              {value}
            </AnimateNumber>
          </NumberText>
        </Container>
      </motion.div>
    </LayoutGroup>
  )
}
