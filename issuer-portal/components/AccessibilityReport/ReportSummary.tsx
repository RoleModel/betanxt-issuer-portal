import { Card, Stack, Typography } from '@mui/material'

interface Violation {
  impact: string
  description: string
  wcag: string
  help: string
  nodes: number
  id?: string
  helpUrl?: string
  tags?: string[]
}

interface TestResult {
  violations: Violation[]
}

interface ReportSummaryProps {
  pages: TestResult[]
  timestamp: string
}

export default function ReportSummary({ pages, timestamp }: ReportSummaryProps) {
  const totalViolations = pages.reduce((total, test) => total + test.violations.length, 0)
  const passedPages =
    pages.length - pages.filter((test) => test.violations.length > 0).length

  return (
    <>
      {/* Last Updated */}
      <Typography variant="body3" color="text.secondary" gutterBottom>
        Last updated: {new Date(timestamp).toLocaleString()}
      </Typography>

      {/* Summary Stats */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h4" color="primary">
            {pages.length}
          </Typography>
          <Typography variant="body3" color="text.secondary">
            Pages Tested
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography
            variant="h4"
            color={
              pages.every((test) => test.violations.length === 0)
                ? 'success.main'
                : 'warning.dark'
            }
          >
            {passedPages}
          </Typography>
          <Typography variant="body3" color="text.secondary">
            Pages Passed
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography
            variant="h4"
            color={
              pages.some((test) => test.violations.length > 0)
                ? 'error.dark'
                : 'success.main'
            }
          >
            {totalViolations}
          </Typography>
          <Typography variant="body3" color="text.secondary">
            Total Issues
          </Typography>
        </Card>
      </Stack>
    </>
  )
}
