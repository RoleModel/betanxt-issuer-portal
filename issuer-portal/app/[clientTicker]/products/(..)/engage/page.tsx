'use client'

import CommentsIcon from '@rolemodel/betanxt-design-system/components/icons/brand/CommentsIcon'
import DatabaseStackIcon from '@rolemodel/betanxt-design-system/components/icons/brand/DatabaseStackIcon'
import TeamGrowthIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamGrowthIcon'
import TimerClockIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TimerClockIcon'
import Image from 'next/image'

import { Check } from '@mui/icons-material'
import {
  Card,
  CardContent,
  CardHeader,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'

import FeatureTile from '@/components/FeatureTile'
import CTACard from '@/components/Products/CTACard'
import { ProductsLayout } from '@/components/Products/ProductsLayout'
import { SidebarCard } from '@/components/Products/SidebarCard'

export default function EngagePage() {
  const theme = useTheme()

  const benefits = [
    {
      icon: <TeamGrowthIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Overcome voter complacency',
      description:
        'Enhanced solicitation and communication through multiple platforms maximize shareholder engagement.',
    },
    {
      icon: <DatabaseStackIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Gain actionable shareholder data',
      description:
        'Demographics and robust data analysis are integrated into a detailed plan of action with our in-house call center and relationship managers to enhance our solicitation strategies to obtain quorum faster.',
    },
    {
      icon: <TimerClockIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Access real-time voting status',
      description:
        'Real-time voting data and account information are accessible 24/7 from our web-based dashboard, providing visibility into the entire process and current voter status.',
    },
    {
      icon: <CommentsIcon accentColor="#ebb322" fontSize="3xl" />,
      title: 'Digital-first approach',
      description:
        'Customized omni-channel technology increases instant communication with branded emails and text messages enabling you to meet investors where they are.',
    },
  ]

  const features = [
    { name: 'Email campaigns', essential: true, enhanced: true, ultimate: true },
    { name: 'Multi-language SMS', essential: true, enhanced: true, ultimate: true },
    { name: 'Postcard mailings', essential: true, enhanced: true, ultimate: true },
    { name: 'Voicemail messages', essential: true, enhanced: true, ultimate: true },
    {
      name: 'Inbound information agent',
      essential: true,
      enhanced: true,
      ultimate: true,
    },
    { name: 'Data extraction', essential: false, enhanced: true, ultimate: true },
    { name: 'Text reminder', essential: false, enhanced: true, ultimate: true },
    { name: 'Verbal calls', essential: false, enhanced: false, ultimate: true },
    { name: 'Outbound calling', essential: false, enhanced: false, ultimate: true },
    { name: 'Engagement follow', essential: false, enhanced: false, ultimate: true },
  ]

  const leftColumnContent = (
    <Stack gap={2}>
      <Typography
        variant="h1"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: theme.vars.palette.text.primary,
        }}
      >
        Achieve quorum and proposal passage by generating greater participation
      </Typography>
      <Typography variant="body1">
        <strong>Retail shareholder</strong> votes are critical to achieving quorum and
        passing proposals. Large retail brokerage firms continue to adjust their
        discretionary voting policies, impacting how votes are cast at shareholder
        meetings. This can produce a voting shortfall for issuers that have not
        effectively enhanced their engagement activities with retail shareholders.
      </Typography>
      <Typography variant="body1">
        <strong>BetaNXT Engage</strong> is a suite of omni-channel tools that helps
        issuers achieve quorum and proposal passage by generating greater participation
        from retail shareholders. Our shareholder meeting experts will analyze your
        position distribution, event strategy, and history to help you choose the Engage
        package that&apos;s right for you.
      </Typography>
      <Card>
        <CardHeader title="Benefits" />
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 2,
          }}
        >
          {benefits.map((benefit, index) => (
            <FeatureTile
              key={index}
              variant="base"
              title={benefit.title}
              titleVariant="h2"
              description={benefit.description}
              actionText={''}
              icon={benefit.icon}
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/images/engage-graphic.svg"
            alt="BetaNXT Engage Omni-channel Communication"
            width={415}
            height={420}
            style={{ margin: '0 auto' }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Features" />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>FEATURE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    ESSENTIAL
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    ENHANCED
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    ULTIMATE
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {features.map((feature, index) => (
                  <TableRow key={index}>
                    <TableCell>{feature.name}</TableCell>
                    <TableCell align="center">
                      {feature.essential ? <Check color="success" /> : ''}
                    </TableCell>
                    <TableCell align="center">
                      {feature.enhanced ? <Check color="success" /> : ''}
                    </TableCell>
                    <TableCell align="center">
                      {feature.ultimate ? <Check color="success" /> : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <CTACard />
    </Stack>
  )

  const rightColumnContent = (
    <SidebarCard title="BetaNXT Engage">
      <Typography variant="body2" component="p">
        gives you the tools and touchpoints you need to execute a winning strategy to
        reach and engage retail shareholders.
      </Typography>
    </SidebarCard>
  )

  return (
    <ProductsLayout leftColumn={leftColumnContent} rightColumn={rightColumnContent} />
  )
}
