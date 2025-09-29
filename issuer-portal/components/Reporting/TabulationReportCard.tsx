'use client'

import React from 'react'

import { IconForFileType } from '@rolemodel/betanxt-design-system/components/icons/IconForFileType'
import FeatureTile from '../FeatureTile'

export default function TabulationReportCard() {
  return (
    <FeatureTile
      title="Tabulation Report"
      description="Voting results for each proposal, showing vote counts, percentages, and quorum status."
      icon={<IconForFileType fileType="PDF" />}
      variant="info"
      actionText="Download"
    />
  )
}
