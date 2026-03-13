'use client'

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Gauge } from '@mui/x-charts/Gauge'

import type { QuorumGaugeViewModel } from '@/utils/quorum'

interface QuorumGaugeCardProps {
  title?: string
  model: QuorumGaugeViewModel | null
  loading?: boolean
  className?: string
}

export default function QuorumGaugeCard({
  title,
  model,
  loading = false,
}: QuorumGaugeCardProps) {
  const statusLabel = model?.quorumMet ? 'Quorum Met' : 'Below Quorum'
  const statusColor = model?.quorumMet ? 'success' : 'default'
  const displayTitle = title ?? 'Quorum tracker'

  return (
    <Card elevation={3} sx={{ flex: 1 }}>
      <CardHeader title={displayTitle} subheader={`Quorum requirement: ${model?.quorumRequirementPercent}%`} />
      <CardContent>
        {loading || !model ? (
          <Typography color="text.secondary">Loading quorum data...</Typography>
        ) : (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <Gauge
                width={220}
                height={160}
                value={Math.min(model.percentRepresented, 100)}
                valueMax={100}
                startAngle={-110}
                endAngle={110}
                text={() => `${Math.round(model.percentRepresented)}%`}
                sx={{
                  '& .MuiGauge-valueArc': {
                    fill: model.quorumMet
                      ? 'var(--mui-palette-secondary-main)'
                      : 'var(--mui-palette-primary-main)',
                  },
                  '& .MuiGauge-referenceArc': {
                    fill: 'var(--mui-palette-divider)',
                  },
                  '& .MuiGauge-valueText': {
                    fontSize: 22,
                    transform: 'translate(0px, 0px)',
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip color={statusColor} label={statusLabel} size="small" />
            </Box>

          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
