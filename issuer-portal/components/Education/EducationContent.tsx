'use client'

import ChatQuestionIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChatQuestionIcon'
import ChecklistDocumentIcon from '@rolemodel/betanxt-design-system/components/icons/brand/ChecklistDocumentIcon'
import DocumentEditIcon from '@rolemodel/betanxt-design-system/components/icons/brand/DocumentEditIcon'
import GlobeNetworkIcon from '@rolemodel/betanxt-design-system/components/icons/brand/GlobeNetworkIcon'
import LaptopPlayIcon from '@rolemodel/betanxt-design-system/components/icons/brand/LaptopPlayIcon'
import TeamGroupIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamGroupIcon'
import TrendingUpIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TrendingUpIcon'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

import { Card, CardContent, CardHeader, Container, Stack } from '@mui/material'
import Grid from '@mui/material/Grid'

import FeatureTile from '@/components/FeatureTile'
import ResourceTitle from '@/components/ResourceTitle'
import ScrollContainer from '@/components/ScrollContainer'

export default function EducationContent() {
  const router = useRouter()
  const _pathname = usePathname()

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
        onClick: () => router.push('/education/industry-trends'),
        icon: <TrendingUpIcon fontSize="3xl" />,
      },
      {
        title: 'Video Tutorials',
        titleVariant: 'h2' as const,
        description: 'Watch and learn',
        actionText: 'Watch Tutorials',
        onClick: () => router.push('/education/video-tutorials'),
        icon: <LaptopPlayIcon fontSize="3xl" />,
      },
      {
        title: 'FAQs',
        titleVariant: 'h2' as const,
        description: 'Quick answers, real clarity',
        actionText: 'View FAQs',
        onClick: () => router.push('/education/faqs'),
        icon: <ChatQuestionIcon fontSize="3xl" />,
      },
    ],
    [router]
  )

  const documentTemplates = React.useMemo(
    () =>
      [1, 2, 3, 4, 5, 6].map((i) => ({
        title: `Template #${i}`,
        description: 'Template description',
        actionText: 'Download',
        icon: <DocumentEditIcon />,
      })),
    []
  )

  const forms = React.useMemo(
    () => [
      {
        title: 'NOBO Request Form',
        description: 'Complete this form and send it to documents@betanxt.com.',
        actionText: 'Download',
        pdfUrl: '/documents/betanxt-nobo-request-form-0125-250220.pdf',
        href: '/documents/betanxt-nobo-request-form-0125-250220.pdf',
      },
      {
        title: 'Proxy Campaign Set-Up Form',
        description:
          'Simply download, complete, and email this form and email it to documents@betanxt.com.',
        actionText: 'Download',
        pdfUrl: '/documents/proxy-campaign-set-up-2025-250127.pdf',
        href: '/documents/proxy-campaign-set-up-2025-250127.pdf',
      },
      {
        title: 'Fee Schedule',
        description:
          'For member organizations distributing proxy and other issuer-related materials to beneficial owners.',
        actionText: 'Download',
        pdfUrl: '/documents/proxy-fee-schedule-january-2025-250127.pdf',
        href: '/documents/proxy-fee-schedule-january-2025-250127.pdf',
      },
      {
        title: 'Delivery Guidelines',
        description:
          'The procedures and requirements for using a third party to receive and handle deliveries on behalf of the intended recipient.',
        actionText: 'Download',
        pdfUrl: '/documents/delivery-guidelines-2025-250127.pdf',
        href: '/documents/delivery-guidelines-2025-250127.pdf',
      },
      {
        title: 'Legal Proxy',
        description:
          'Give to your shareholders so they may attend this meeting and vote their shares in person.',
        actionText: 'Download',
        pdfUrl: '/documents/legal-proxy-250127.pdf',
        href: '/documents/legal-proxy-250127.pdf',
      },
      {
        title: 'Sample Invoices',
        description:
          'Illustrates billing details, such as itemized charges, taxes, and total amounts due, in a professional format for invoicing purposes.',
        actionText: 'Download',
        pdfUrl: '/documents/bpx-bpv-invoice-250127.pdf',
        href: '/documents/bpx-bpv-invoice-250127.pdf',
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
        onClick: () => router.push('/products/engage'),
      },
      {
        title: 'Inspector of Elections',
        description: 'Ensures transparent vote counting and certified inspection',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <ChecklistDocumentIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'secondary' as const,
        onClick: () => router.push('/products/inspector-of-elections'),
      },
      {
        title: 'Digital Shareholder Meeting',
        description:
          'Enable shareholders to participate in annual meetings remotely with the same level of access as in-person attendees',
        actionText: 'Learn More',
        titleVariant: 'h2' as const,
        icon: <GlobeNetworkIcon accentColor="#ebb322" fontSize="3xl" />,
        variant: 'info' as const,
        onClick: () => router.push('/products/digital-shareholder-meetings'),
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
    <Container component="main" maxWidth="xl" sx={{ p: { xs: 1, md: 3 } }}>
      <Grid order={1} container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {educationPaperItems.map((item, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <FeatureTile {...item} height="100%" />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid order={{ xs: 2, sm: 2 }} size={12}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="stretch">
                    {servicePapers.map((service, index) => (
                      <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                        <FeatureTile flex={true} {...service} height="100%" />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid order={{ xs: 3, sm: 2 }} container spacing={3} size={{ xs: 12, md: 12 }}>
          <Grid size={{ xs: 12 }}>
            <Stack spacing={3}>
              <Card sx={{ height: 'auto' }}>
                <CardHeader title="Document Resources" />
                <CardContent sx={{ p: 0 }}>
                  <ScrollContainer direction="horizontal">
                    <Stack spacing={2} direction="row" sx={{ p: 2, flexWrap: 'nowrap' }}>
                      {documentTemplates.map((template, index) => (
                        <ResourceTitle key={index} {...template} minWidth="200px" />
                      ))}
                    </Stack>
                  </ScrollContainer>
                </CardContent>
              </Card>

              <Card sx={{ height: 'auto' }}>
                <CardHeader title="Forms" />
                <CardContent sx={{ p: 0 }}>
                  <ScrollContainer direction="horizontal">
                    <Stack spacing={2} direction="row" sx={{ p: 2, flexWrap: 'nowrap' }}>
                      {forms.map((form, index) => (
                        <ResourceTitle key={index} {...form} minWidth="200px" />
                      ))}
                    </Stack>
                  </ScrollContainer>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  )
}
