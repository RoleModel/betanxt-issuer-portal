import React from 'react'

import {
  Box,
  Card,
  CardContent,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

const AccessibilityReportLoading: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Skeleton variant="text" width={300} height={48} />
          <Skeleton variant="text" width={500} height={24} />
        </Box>

        {/* Summary Cards */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} sx={{ flex: 1 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box>
                    <Skeleton variant="text" width={60} height={40} />
                    <Skeleton variant="text" width={100} height={20} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="rectangular" width={200} height={36} />
        </Stack>

        {/* Results */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>

          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map((index) => (
              <Box key={index} sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={24} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

export default AccessibilityReportLoading
