'use client'

import GearProcessIcon from '@rolemodel/betanxt-design-system/components/icons/brand/GearProcessIcon'
import GroupMeetingIcon from '@rolemodel/betanxt-design-system/components/icons/brand/GroupMeetingIcon'
import StarBadgeIcon from '@rolemodel/betanxt-design-system/components/icons/brand/StarBadgeIcon'
import TeamDiscussionIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamDiscussionIcon'
import TeamMeeting2Icon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamMeeting2Icon'

import { OpenInNew } from '@mui/icons-material'
import { Card, CardContent, CardHeader, Stack, Typography, useTheme } from '@mui/material'

import FeatureTile from '@/components/FeatureTile'
import ProductsLayout from '@/components/Layout/ProductLayout'
import CTACard from '@/components/Products/CTACard'
import { SidebarCard } from '@/components/Products/SidebarCard'

export default function EndToEndProxySolutionsPage() {
  const theme = useTheme()

  const products = [
    {
      title: 'MIC Digital Shareholder Meeting',
      description:
        'Client service is the linchpin of all our solutions. An experienced support professional will work with you to plan, manage and execute your digital meeting - and, if you choose, join you on dry runs and prep calls. In addition, BetaNXT provides technical guidance, ensuring a flawless meeting.',
      variant: 'primary' as const,
      icon: <TeamMeeting2Icon accentColor="#ebb322" fontSize="3xl" />,
    },

    {
      title: 'BetaNXT Engage',
      description:
        'An add-on to our end-to-end proxy solution, BetaNXT Engage provides a suite of omni-channel tools that nelps issuers achieve quorum and proposal passage by generating greater participation from retail shareholders. Our annual meeting experts will analyze your position distribution, event strategy and history to help design a program that works best for you.',
      variant: 'tertiary' as const,
      icon: <GroupMeetingIcon accentColor="#ebb322" fontSize="3xl" />,
    },
  ] as const
  const benefits = [
    {
      icon: <StarBadgeIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Robust web hosting and interactive documents',
      description:
        'Client service is the linchpin of all BetaNXT solutions. Al dedicated campaign manager and team of specialists communicate with you to plan and manage the aspects of the proxy event from developing a comprehensive plan and timeline tailored to your needs to meeting date reporting and beyond. Acting as an extension of your team, we use a consultative approach to ensure you achieve your event goals.',
    },
    {
      icon: <GearProcessIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Unparalleled proxy management',
      description:
        "Shareholder engagement efforts are paramount to a successful proxy outcome. A document hosting solution that is intuitive and visually appealing, while meeting compliance regulations, helps to enhance the investor experience and therefore engagement. BetaNXT's online document hosting solution provides customized websites that extend your corporate website and investor relations messaging. Your important documents are fully enhanced to open quickly and are enabled for optimal mobile device performance.",
    },
    {
      icon: <TeamDiscussionIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Discovery planning and implementation',
      description: (
        <ul style={{ listStyleType: 'disc', margin: 0, paddingLeft: '20px' }}>
          <li>Dedicated proxy experts manage your entire campaign</li>
          <li>In-depth analysis of your timeline, pre-record date data and budget</li>
          <li>
            Secure file transfer protocols and procedures to maikain control of your dela
            and event
          </li>
        </ul>
      ),
    },
    {
      icon: <TeamDiscussionIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Print and distribution management',
      description: (
        <ul style={{ listStyleType: 'disc', margin: 0, paddingLeft: '20px' }}>
          <li>
            Custom-branded shareholder materials including multi-color print capabilities
          </li>
          <li>Scalable, integrated print and distribution network</li>
          <li>Enhanced mail, e-delivery, and text capabilities</li>
        </ul>
      ),
    },
    {
      icon: <TeamDiscussionIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Real-time proxy tabulation',
      description: (
        <ul style={{ listStyleType: 'disc', margin: 0, paddingLeft: '20px' }}>
          <li>Real-time vote tracking and reporting available</li>
          <li>
            24 / 7 In-depth data analytics and vote modeling for all tabulation scenarios
          </li>
        </ul>
      ),
    },
    {
      icon: <TeamDiscussionIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Shareholder meeting/post-meeting review',
      description: (
        <ul style={{ listStyleType: 'disc', margin: 0, paddingLeft: '20px' }}>
          <li>In - depth data and vote analysis</li>
          <li>Transparent cost analysis</li>
          <li>Postmeeting guidance for future campaigns</li>
        </ul>
      ),
    },
  ]

  const leftColumnContent = (
    <Stack gap={2}>
      <Typography
        variant="h2"
        sx={{
          fontSize: theme.typography.pageTitle.fontSize,
          fontWeight: 700,
          fontFamily: 'var(--font-tungsten)',
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
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              sm: '1fr',
              md: '1fr 1fr',
            },
            gap: 2,
          }}
        >
          {products.map((product, index) => (
            <FeatureTile
              key={index}
              variant={product.variant}
              title={product.title}
              titleVariant="h1"
              description={product.description}
              brandFont={true}
              icon={product.icon}
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Benefits" />
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              sm: '1fr',
              md: '1fr 1fr',
            },
            gridTemplateRows: {
              sm: 'auto',
              md: 'auto auto',
            },
            gap: 2,
          }}
        >
          {benefits.map((benefit, index) => (
            <FeatureTile
              key={index}
              variant="base"
              title={benefit.title}
              titleVariant="h1"
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

  const rightColumnContent = (
    <SidebarCard
      title="Issuer Solutions​ Overview"
      button
      icon={<OpenInNew />}
      buttonText="Visit Issuer Solutions"
      onClick={() => {
        window.open('https://betanxt.com/issuer-solutions', '_blank')
      }}
    >
      <Typography variant="body3" component="p">
        Get a complete look at the tools and services available to you in one place.
      </Typography>
    </SidebarCard>
  )

  return (
    <ProductsLayout
      leftColumnContent={leftColumnContent}
      rightColumnContent={rightColumnContent}
    />
  )
}
