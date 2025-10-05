import { Container, Box } from '@mui/material'

import { IndustryTrendsCard } from '@/components/Education/IndustryTrendsCard'

const industryTrends = [
  {
    title: 'Briefing – Lessons from the 2025 Proxy Season | Governance Intelligence ',
    content:
      'The 2025 proxy season was influenced by several key issues, including changes announced in Staff Legal Bulletin 14M regarding the interpretation of Rule 14a-8, and evolving narratives around diversity, equity, and inclusion (DE&I).',
    url: 'https://www.governance-intelligence.com/events/briefing-lessons-2025-proxy-season',
    img: '/images/getty-images-6DMo9-gGYNI-unsplash.jpg',
    date: 'Tuesday, July 22, 2025',
    duration: '6 min read',
    externalLink: true,
    actionText: 'View On Demand',
  },
  {
    title: 'Shareholder Activism Reaches Record Highs Despite Lower Success Rates',
    content:
      'The 2024 proxy season witnessed a record 411 shareholder activism campaigns in the Russell 3000, nearly doubling from 206 in 2021. However, activist success rates dropped to 38% in 2024 from 56% in 2023, marking the lowest since 2021. First-time activists now outpace major activists in campaign launches.',
    url: 'https://corpgov.law.harvard.edu/2025/06/18/shareholder-activism-developments-in-the-2025-proxy-season/',
    img: '/images/getty-images-WXl3cPupXOw-unsplash.jpg',
    date: 'June 18, 2025',
    duration: '8 min read',
    externalLink: true,
  },
  {
    title: 'Digital Transformation in Proxy Voting: Rise of Pass-Through Technology',
    content:
      'Technology is revolutionizing proxy voting with blockchain, AI, and big data analytics. Pass-through voting is emerging as a key trend, giving investors a voice in how asset managers vote underlying equities. Retail investor participation reached 29.8% in 2024, the highest in nine years.',
    url: 'https://www.proxymity.io/views/decoding-proxy-season/',
    img: '/images/getty-images-yKvoH7Gis7A-unsplash.jpg',
    date: 'August 15, 2024',
    duration: '5 min read',
    externalLink: true,
  },
  {
    title: 'Governance Proposals Surge While ESG Support Declines',
    content:
      'Support for governance-focused shareholder proposals jumped from 31% in 2023 to 42% in 2024, driven by proposals to eliminate supermajority voting requirements which averaged 72% support. Meanwhile, environmental and social proposals saw volumes drop 44% from 400 in 2024 to 224 in 2025.',
    url: 'https://www.glasslewis.com/article/proxy-season-2024-key-trends-developments-in-the-united-states',
    img: '/images/getty-images-YuyQoigjXGc-unsplash.jpg',
    date: 'July 30, 2024',
    duration: '7 min read',
    externalLink: true,
  },
  {
    title: 'Virtual vs. Hybrid Shareholder Meetings: The Ongoing Debate',
    content:
      'In Canada, 52% of S&P/TSX Composite companies held virtual-only meetings in 2023, but shareholders increasingly prefer hybrid formats. The Canadian Council for Good Governance indicates growing preference for hybrid AGMs that combine virtual convenience with in-person accessibility.',
    url: 'https://www.directors-institute.com/post/the-future-of-proxy-voting-and-shareholder-engagement',
    img: '/images/paris-bilal-glD2K8OZALU-unsplash.jpg',
    date: 'September 12, 2024',
    duration: '4 min read',
    externalLink: true,
  },
  {
    title: 'AI and Responsible Technology: The Next Frontier in Proxy Proposals',
    content:
      'Responsible artificial intelligence is emerging as a key theme on corporate proxy ballots. AI-related proposals received strong support at major tech companies including Netflix (43.3%), Apple (37.5%), and Warner Brothers Discovery (24%) during the 2024 season, signaling growing investor concern about AI governance.',
    url: 'https://www.iss-corporate.com/resources/blog/pro-esg-shareholder-proposals-regaining-momentum-in-2024/',
    img: '/images/point-normal-wM-NIOY_vQU-unsplash.jpg',
    date: 'October 22, 2024',
    duration: '6 min read',
    externalLink: true,
  },
]

export default function IndustryTrendsPage() {
  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, sm: 3 } }}>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}
        gap={{ xs: 2, sm: 3, }}
      >
        {industryTrends.map((industryTrend) => (
          <IndustryTrendsCard key={industryTrend.title} {...industryTrend} />
        ))}
      </Box >
    </Container>
  )
}
