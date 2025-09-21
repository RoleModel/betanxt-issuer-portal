import { Box, Grid } from '@mui/material'

import { IndustryTrendsCard } from '@/components/Education/IndustryTrendsCard'

const industryTrends = [
  {
    title: 'Briefing – Lessons from the 2025 Proxy Season | Governance Intelligence ',
    content:
      'The 2025 proxy season was influenced by several key issues, including changes announced in Staff Legal Bulletin 14M regarding the interpretation of Rule 14a-8, and evolving narratives around diversity, equity, and inclusion (DE&I).',
    url: 'https://www.google.com',
    img: 'https://www.google.com',
    date: 'Tuesday, September 17, 2025',
    duration: '45 minutes',
    externalLink: true,
  },
  {
    title: 'SEC Finalizes Rule 14a-8 Amendments: What Issuers Should Expect in 2026',
    content:
      "The SEC's latest 14a-8 amendments refine 'ordinary business' and 'duplication' tests, raising the bar for certain ESG proposals while clarifying resubmission thresholds. Issuers should recalibrate their no-action strategies and enhance board rationales in engagement materials.",
    url: 'https://example.com/articles/sec-14a8-amendments-2025',
    img: '/images/education/trends-sec-14a8.jpg',
    date: 'Wednesday, September 10, 2025',
    duration: '6 min read',
    externalLink: true,
  },
  {
    title: 'Universal Proxy, Two Years In: More Settlements, Narrower Victory Margins',
    content:
      'Contested elections are seeing earlier settlements and closer margins as investors leverage universal proxy cards. Boards are refreshing skill matrices and enhancing disclosure around director overboarding, tenure, and performance to mitigate activism risk.',
    url: 'https://example.com/research/universal-proxy-2025',
    img: '/images/education/trends-universal-proxy.jpg',
    date: 'Monday, August 25, 2025',
    duration: '5 min read',
    externalLink: true,
  },
  {
    title: 'ESG Proposals Evolve: Climate Assurance and Scope 3 Down; Audit Tones Up',
    content:
      'Support for prescriptive climate proposals moderated, while investors favored audit and assurance-oriented requests tied to material risk. Pass-through voting pilots expanded among index providers, shifting emphasis to transparent policy rationales.',
    url: 'https://example.com/insights/esg-proposals-2025',
    img: '/images/education/trends-esg.jpg',
    date: 'Friday, July 18, 2025',
    duration: '7 min read',
    externalLink: true,
  },
]

export default function IndustryTrendsPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Grid container spacing={3}>
        {industryTrends.map((industryTrend) => (
          <Grid size={{ sm: 12, md: 4, lg: 3 }} key={industryTrend.title}>
            <IndustryTrendsCard {...industryTrend} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
