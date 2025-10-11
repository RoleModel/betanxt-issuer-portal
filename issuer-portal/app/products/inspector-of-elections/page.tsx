'use client'

import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import DocumentEditIcon from '@rolemodel/betanxt-design-system/components/icons/brand/DocumentEditIcon'
import HandshakeAgreementIcon from '@rolemodel/betanxt-design-system/components/icons/brand/HandshakeAgreementIcon'
import JusticeScaleIcon from '@rolemodel/betanxt-design-system/components/icons/brand/JusticeScaleIcon'
import PersonShieldIcon from '@rolemodel/betanxt-design-system/components/icons/brand/PersonShieldIcon'
import TeamCircleIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamCircleIcon'

import { Card, CardContent, CardHeader, Stack, Typography, useTheme } from '@mui/material'

import FeatureTile from '@/components/FeatureTile'
import ProductsLayout from '@/components/Layout/ProductLayout'
import CTACard from '@/components/Products/CTACard'
import { SidebarCard } from '@/components/Products/SidebarCard'
import DocumentViewer from '@/components/Documents/DocumentViewer'
import { useState } from 'react'

export default function InspectorOfElectionsPage() {
  const theme = useTheme()
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
      <Typography
        variant="h1"
        sx={{
          fontFamily: 'var(--font-tungsten)',
          fontWeight: 700,
          color: theme.vars.palette.text.primary,
        }}
      >
        Achieve quorum and proposal passage by generating greater participation
      </Typography>
      <Typography variant="body1">
        <strong>MIC Digital Shareholder Meeting (DSM)</strong> enables shareholders to
        participate in annual meetings remotely with the same level of access as in-person
        attendees - they can view, vote, and ask questions. DSM also allows you to shape
        your meeting to best facilitate your shareholders&apos; engagement with ease of
        access on any device, real-time voting, questions, polling, and more. Combined
        with the platform&apos;s Q&A management capabilities, branding options, and
        high-touch service, DSM is the industry&apos;s most innovative and leading
        platform.
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
    </Stack>
  )

  const rightColumnContent = (<>
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
