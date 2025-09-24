'use client'
import React from 'react'
import { Card, CardContent, Grid, Stack } from '@mui/material'
import PersonArmsUpIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PersonArmsUpIcon'
import TargetBullsEyeIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TargetBullsEyeIcon'
import FeatureTile from '@/components/FeatureTile'

import type { Meeting } from '@/types/api'
import { PdfIcon } from '@rolemodel/betanxt-design-system/components/icons/PdfIcon'
import { Container } from '@mui/material'

interface Phase8LayoutProps {
  meetingId?: string
  meeting?: Meeting
}

export default function Phase7Layout({ meeting }: Phase8LayoutProps) {
  return (
    <Container>
      <Stack spacing={3}>
        <FeatureTile
          title={`Congratulations on the Completion of your ${meeting?.meetingYear} ${meeting?.meetingType}!`}
          icon={<PersonArmsUpIcon fontSize="4xl" />}
        />
        <Card>
          <CardContent>
            <FeatureTile
              title="Post Meeting Survey"
              variant="info"
              description="We would love to hear from you! With every Meeting, we at BetaNXT are always looking for ways to improve your expereince and get your feedback on how your Meeting went this year. Please take a moment to complete this Post-Meeting survey to help us continue better assisting you in the future!"
              actionText="Take Survey"
              icon={<TargetBullsEyeIcon fontSize="4xl" />}
              onClick={() => {
              }}
            />
          </CardContent>
        </Card>
        <Grid container spacing={3} direction="row" justifyContent="stretch">
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <FeatureTile
              title="Final Tabulation Report"
              actionText="Download"
              icon={<PdfIcon fontSize="inherit" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <FeatureTile
              title="Registered Accounts Voted Report"
              actionText="Download"
              icon={<PdfIcon fontSize="inherit" />}
            />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  )
}
