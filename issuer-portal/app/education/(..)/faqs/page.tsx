'use client'

import React, { useEffect, useState } from 'react'

import { ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  LinearProgress,
  Typography,
} from '@mui/material'

const faqs = [
  {
    question: 'How does the universal proxy rule affect contested elections?',
    answer:
      'The universal proxy rule, effective since 2022, requires both management and dissident proxy cards to include all director nominees from both sides. This gives shareholders the ability to vote for their preferred combination of candidates from both slates on a single proxy card, rather than being forced to choose one slate entirely. The rule applies to contested solicitations where dissidents seek to elect directors to represent more than 50% of board positions.',
  },
  {
    question: 'What timeline must dissidents and registrants follow in proxy contests?',
    answer:
      "Under the universal proxy rule, dissidents must file their definitive proxy statement at least 25 calendar days before the shareholder meeting date. They must also provide notice to the company no later than 60 calendar days before the anniversary of the previous year's annual meeting. Management must include dissident nominees on their proxy card and provide notice of their nominees to dissidents by the later of 25 calendar days before the meeting or 5 days after receiving dissident notice.",
  },
  {
    question: 'Are broker discretionary votes allowed in director elections?',
    answer:
      'No, broker discretionary voting is not permitted for director elections under NYSE and NASDAQ rules. Brokers cannot vote uninstructed shares in contested or uncontested director elections - they must receive specific voting instructions from beneficial owners. This rule helps ensure that only shareholders who actively participate in the voting process influence director elections.',
  },
  {
    question: 'How is voting handled for beneficial shareholders in virtual meetings?',
    answer:
      'Beneficial shareholders (those holding shares through brokers) can participate in virtual meetings by obtaining a legal proxy from their broker or by using voting control numbers provided by their broker. The virtual meeting platform verifies their eligibility and provides access to voting functions. BetaNXT&apos;s digital shareholder meeting platform ensures beneficial shareholders have the same participation rights as registered shareholders, including real-time voting and Q&A submission capabilities.',
  },
  {
    question: 'What voting options must be presented on proxy cards?',
    answer: `Proxy cards must provide shareholders with clear voting options: "For," "Against," and "Abstain" for most proposals. For director elections, options include "For," "Against," or "Withhold." The proxy card must clearly identify each nominee and proposal, provide adequate space for marking votes, and include instructions for alternative voting methods such as internet or telephone voting.`,
  },
  {
    question: 'What are key steps in the proxy campaign process via the portal?',
    answer:
      'Through the BetaNXT Issuer Portal, the proxy campaign process includes: 1) Document preparation and filing coordination, 2) Proxy statement review and approval workflows, 3) Distribution strategy planning with transfer agents, 4) Real-time vote tracking and reporting, 5) Solicitation campaign management, 6) Meeting preparation and digital platform setup, and 7) Post-meeting reporting and compliance documentation. The portal provides centralized task management and deadline tracking throughout the entire process.',
  },
  {
    question: 'Can I monitor vote participation trends by channel?',
    answer:
      'Yes, the BetaNXT platform provides comprehensive analytics on vote participation across all channels including internet, telephone, mail, and in-person voting. You can track participation rates by channel, monitor trends over time, identify peak voting periods, and analyze demographic patterns. This data helps optimize future solicitation strategies and understand shareholder engagement preferences.',
  },
  {
    question: 'How does BetaNXT handle over‑voting or vote exceptions?',
    answer:
      'BetaNXT employs sophisticated vote reconciliation processes to identify and resolve over-voting situations where more votes are submitted than shares outstanding. The system flags discrepancies in real-time, implements pro-rata reduction protocols when necessary, and maintains detailed audit trails. Vote exceptions are escalated to inspectors of elections with full documentation for proper resolution according to applicable state law and corporate governance requirements.',
  },
  {
    question: 'What is pass‑through voting and how might it evolve?',
    answer:
      "Pass-through voting allows beneficial owners to direct how their shares held by intermediaries (like brokers or asset managers) are voted. Current regulations require intermediaries to follow voting instructions, but there's ongoing discussion about enhancing transparency and ensuring voting instructions are properly transmitted. Future evolution may include blockchain-based voting systems, enhanced disclosure requirements, and improved technology for direct communication between issuers and beneficial owners.",
  },
  {
    question: 'What constitutes a quorum during hybrid or virtual meetings?',
    answer:
      "Quorum requirements for hybrid or virtual meetings are the same as in-person meetings - typically a majority of outstanding voting shares must be represented (present in person or by proxy). Virtual attendees count toward quorum if they're properly authenticated and verified. The key difference is the verification process: virtual participants must be validated through secure access methods, and the meeting platform must accurately track and report attendance for quorum calculations.",
  },
  {
    question: 'How are "under-votes" on proposals managed?',
    answer:
      "Under-votes occur when shareholders don't vote on specific proposals while voting on others. These are typically counted as abstentions and don't affect the outcome unless the proposal specifically requires a majority of outstanding shares (rather than just votes cast). The BetaNXT system tracks under-votes separately, provides clear reporting to management and inspectors, and ensures proper tabulation according to the company's governing documents and applicable state law requirements.",
  },
]

const FAQsPage: React.FC = () => {
  const [expanded, setExpanded] = React.useState<string | false>('panel1')
  const [loading, setLoading] = useState(true)

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false)
    }

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <LinearProgress />
  }

  return (
    <Container maxWidth="lg" sx={{ p: 3 }}>
      {faqs.map((faq, index) => (
        <Accordion
          key={index}
          expanded={expanded === `panel-${index}`}
          onChange={handleChange(`panel-${index}`)}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls={`panel-${index}-content`}
            id={`panel-${index}-header`}
          >
            <Typography component="span">{faq.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>{faq.answer}</AccordionDetails>
        </Accordion>
      ))}
    </Container>
  )
}

export default FAQsPage
