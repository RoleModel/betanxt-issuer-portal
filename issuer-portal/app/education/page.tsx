'use client'

import ChatQuestionIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChatQuestionIcon'
// Dynamically import icons to improve initial load performance
import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import DocumentEditIcon from '@rolemodel/betanxt-design-system/components/icons/brand/DocumentEditIcon'
import GlobeNetworkIcon from '@rolemodel/betanxt-design-system/components/icons/brand/GlobeNetworkIcon'
import LaptopPlayIcon from '@rolemodel/betanxt-design-system/components/icons/brand/LaptopPlayIcon'
import TeamGroupIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamGroupIcon'
import TrendingUpIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TrendingUpIcon'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

import { CallToActionOutlined } from '@mui/icons-material'
import { Box, Card, CardContent, CardHeader, Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import FeatureTile from '@/components/FeatureTile'
import ResourceTitle from '@/components/ResourceTitle'
import ScrollContainer from '@/components/ScrollContainer'

const EducationPageContent = () => {
  const router = useRouter()
  const pathname = usePathname()

  const educationPaperItems = React.useMemo(
    () => [
      {
        title: 'Proxy Guide',
        titleVariant: 'h2' as const,
        description: 'How the proxy process works',
        actionText: 'View Guide',
        icon: <ChecklistDocumentIcon fontSize="3xl" />,
      },
      {
        title: 'SPR Registration Guide',
        titleVariant: 'h2' as const,
        description: 'Get started with SPR Registration',
        actionText: 'View Guide',
        icon: <DocumentEditIcon fontSize="3xl" />,
      },
      {
        title: 'Digital Shareholder Meeting Guide',
        titleVariant: 'h2' as const,
        description: 'Insights to support the execution of your annual meeting',
        actionText: 'View Guide',
        icon: <TeamGroupIcon fontSize="3xl" />,
      },
      {
        title: 'Industry Trends',
        titleVariant: 'h2' as const,
        description: "What's shaping proxy events",
        actionText: 'View Trends',
        onClick: () => {
          router.push('/education/industry-trends')
        },
        icon: <TrendingUpIcon fontSize="3xl" />,
      },
      {
        title: 'Video Tutorials',
        titleVariant: 'h2' as const,
        description: 'Watch and learn',
        actionText: 'Watch Tutorials',
        onClick: () => {
          router.push('/education/video-tutorials')
        },
        icon: <LaptopPlayIcon fontSize="3xl" />,
      },
      {
        title: 'FAQs',
        titleVariant: 'h2' as const,
        description: 'Quick answers, real clarity',
        actionText: 'View FAQs',
        onClick: () => {
          router.push('/education/faqs')
        },
        icon: <ChatQuestionIcon fontSize="3xl" />,
      },
    ],
    [router]
  )

  const documentTemplates = React.useMemo(
    () => [
      {
        title: 'Template #1',
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      },
      {
        title: 'Template #2',
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      },
      {
        title: 'Template #3',
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      },
      {
        title: 'Template #4',
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      },
      {
        title: 'Template #5',
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      },
    ],
    []
  )

  const forms = React.useMemo(
    () => [
      {
        title: 'NOBO Request Form',
        description: 'Form description',
        actionText: 'Download Form',
        icon: <CallToActionOutlined />,
      },
      {
        title: 'Proxy Campaign Set-Up',
        description: 'Form description',
        actionText: 'Download Form',
        icon: <CallToActionOutlined />,
      },
      {
        title: 'Fee Schedule',
        description: 'Form description',
        actionText: 'Download Form',
        icon: <CallToActionOutlined />,
      },
      {
        title: 'Form #4',
        description: 'Form description',
        actionText: 'Download Form',
        icon: <CallToActionOutlined />,
      },
      {
        title: 'Form #5',
        description: 'Form description',
        actionText: 'Download Form',
        icon: <CallToActionOutlined />,
      },
    ],
    []
  )

  const servicePapers = React.useMemo(
    () => [
      {
        title: 'BetaNXT Engage',
        description:
          'A suite of tools that helps you achieve quorum and proposal passage by generating greater participation from retail shareholders.',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <TrendingUpIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'primary' as const,
        onClick: () => {
          router.push('/products/engage')
        },
      },
      {
        title: 'Inspector of Elections',
        description: 'Ensures transparent vote counting and certified inspection',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <ChecklistDocumentIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'secondary' as const,
        onClick: () => {
          router.push('/products/inspector-of-elections')
        },
      },
      {
        title: 'Digital Shareholder Meeting',
        description:
          'Enable shareholders to participate in annual meetings remotely with the same level of access as in-person attendees',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <GlobeNetworkIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'info' as const,
        onClick: () => {
          router.push('/products/digital-shareholder-meetings')
        },
      },
      {
        title: 'Marketing Assets',
        description: 'Description of Marketing Assets services',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <LaptopPlayIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'default' as const,
      },
    ],
    [router]
  )

  return (
    <Container
      maxWidth="xl"
      sx={{
        p: {
          xs: 1,
          md: 3,
        },
      }}
    >
      <Grid order={1} container spacing={3}>
        {/* TOP SECTION: Main Education Card containing 6 paper components */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {educationPaperItems.map((item, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <FeatureTile {...item} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* MIDDLE SECTION: Document Resources and Forms */}
        <Grid order={{ xs: 3, sm: 1 }} container spacing={3} size={{ xs: 12, md: 8 }}>
          <Grid size={{ xs: 12 }}>
            <Stack spacing={3}>
              <Card sx={{ height: 'auto' }}>
                <CardHeader title="Document Resources" />
                <CardContent sx={{ p: 0 }}>
                  <ScrollContainer direction="horizontal">
                    <Stack
                      direction="row"
                      useFlexGap
                      spacing={2}
                      sx={{
                        p: 2,
                        flexWrap: 'nowrap',
                        minWidth: 'max-content',
                      }}
                    >
                      {documentTemplates.map((template, index) => (
                        <Box key={index} sx={{ minWidth: 200, flexShrink: 0 }}>
                          <ResourceTitle {...template} />
                        </Box>
                      ))}
                    </Stack>
                  </ScrollContainer>
                </CardContent>
              </Card>

              <Card sx={{ height: 'auto' }}>
                <CardHeader title="Forms" />
                <CardContent sx={{ p: 0 }}>
                  <ScrollContainer direction="horizontal">
                    <Stack
                      direction="row"
                      useFlexGap
                      spacing={2}
                      sx={{
                        p: 2,
                        flexWrap: 'nowrap',
                        minWidth: 'max-content',
                      }}
                    >
                      {forms.map((form, index) => (
                        <Box key={index} sx={{ minWidth: 200, flexShrink: 0 }}>
                          <ResourceTitle {...form} />
                        </Box>
                      ))}
                    </Stack>
                  </ScrollContainer>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Grid order={{ xs: 2, sm: 3 }} size={{ xs: 12, md: 4 }}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Service Cards - 2x2 Grid */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ height: 'auto' }}>
                <CardContent>
                  <Stack spacing={2}>
                    {servicePapers.map((service, index) => (
                      <FeatureTile key={index} {...service} />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}

export default EducationPageContent
