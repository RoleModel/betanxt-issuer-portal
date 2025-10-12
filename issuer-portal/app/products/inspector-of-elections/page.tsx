'use client'

import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import DocumentEditIcon from '@rolemodel/betanxt-design-system/components/icons/brand/DocumentEditIcon'
import HandshakeAgreementIcon from '@rolemodel/betanxt-design-system/components/icons/brand/HandshakeAgreementIcon'
import JusticeScaleIcon from '@rolemodel/betanxt-design-system/components/icons/brand/JusticeScaleIcon'
import PersonShieldIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PersonShieldIcon'
import TeamCircleIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamCircleIcon'
import { useState } from 'react'

import { Card, CardContent, CardHeader, Stack, Typography } from '@mui/material'

import DocumentViewer from '@/components/Documents/DocumentViewer'
import FeatureTile from '@/components/FeatureTile'
import ProductsLayout from '@/components/Layout/ProductLayout'
import CTACard from '@/components/Products/CTACard'
import { SidebarCard } from '@/components/Products/SidebarCard'
import { ContentTitle } from '@/components/ContentTitle'

export default function InspectorOfElectionsPage() {
  const [open, setOpen] = useState(false)
  const benefits = [
    {
      icon: <ChecklistDocumentIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Certified Vote Tabulation',
      description: [
        'Independent verification of all voting results',
        'Real-time accuracy monitoring and validation',
        'Compliance with state-specific legal requirements',
      ],
    },
    {
      icon: <TeamCircleIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Pre-Meeting Preparation',
      description: [
        'Shareholder eligibility verification',
        'Voting materials audit and review',
        'Quorum requirement analysis',
      ],
    },
    {
      icon: <PersonShieldIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Meeting Oversight',
      description: [
        'Live meeting supervision and monitoring',
        'Ballot collection and verification processes',
        'Challenge resolution and dispute management',
      ],
    },
    {
      icon: <JusticeScaleIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Legal Compliance Assurance',
      description: [
        'State regulation adherence verification',
        'Documentation and audit trail maintenance',
        'Regulatory filing preparation',
      ],
    },
    {
      icon: <DocumentEditIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Results Certification',
      description: [
        'Official vote count declarations',
        'Legally binding result certifications',
        'Transparent reporting to all stakeholders',
      ],
    },
    {
      icon: <HandshakeAgreementIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Post-Meeting Services',
      description: [
        'Comprehensive voting analysis',
        'Regulatory filing submissions',
        'Detailed compliance reporting',
      ],
    },
  ]

  const leftColumnContent = (
    <Stack useFlexGap gap={2}>
      <ContentTitle
        title="Ensure legal compliance and voting accuracy with certified oversight solutions"
      />
      <Typography variant="body1">
        Most states require an Inspector of Election to ensure the propriety of shareholder voting processes. BetaNXT provides certified Inspector of Elections services that tabulate votes with precision, ensure regulatory compliance, and make legally binding declarations of results. Our experienced team manages the entire oversight process, from pre-meeting preparation to final result certification.
      </Typography>
      <Card>
        <CardHeader title="Benefits" />
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
            gridTemplateRows: 'auto auto auto',
            gap: 2,
          }}
        >
          {benefits.map((benefit, index) => (
            <FeatureTile
              key={index}
              titleVariant="h1"
              variant="base"
              title={benefit.title}
              description={benefit.description}
              actionText={''}
              brandFont={true}
              icon={benefit.icon}
            />
          ))}
        </CardContent>
      </Card>
      <CTACard />
    </Stack >
  )

  const rightColumnContent = (
    <>
      <SidebarCard
        title="Why do I need an Inspector of Elections?"
        button
        buttonText="View PDF Overview"
        onClick={() => setOpen(true)}
      >
        <Typography variant="body3" component="p" gutterBottom>
          Get detailed information about our certified Inspector of Elections services and
          compliance solutions.
        </Typography>
      </SidebarCard>
      <DocumentViewer
        open={open}
        onClose={() => setOpen(false)}
        fileUrl={'/documents/inspector-of-elections.pdf'}
        title={'Inspector of Elections Overview'}
        showCommentButton={false}
        showHistoryButton={false}
        showDownloadButton={true}
      />
    </>
  )

  return (
    <ProductsLayout
      leftColumnContent={leftColumnContent}
      rightColumnContent={rightColumnContent}
    />
  )
}
