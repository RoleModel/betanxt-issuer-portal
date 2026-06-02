import {
  Button,
  Column,
  Container,
  Hr,
  Row,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'

import BNLogo from './components/BNLogo'
import { Footer } from './components/Footer'
import { Layout } from './components/Layout'
import { COLORS, CONTAINER_WIDTH, FONTS } from './styles'
import type { TabulationReportEmailProps, TabulationReportProposal } from './types'

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function pct(votes: number, total: number): number {
  if (total === 0) return 0
  return Math.round((votes / total) * 100)
}

interface ProgressBarProps {
  percent: number
  color: string
}

function ProgressBar({ percent, color }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      style={{
        width: '100%',
        height: '6px',
        backgroundColor: '#E5E7EB',
        borderRadius: '3px',
        overflow: 'hidden',
        margin: '4px 0 0',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '3px',
        }}
      />
    </div>
  )
}

interface ProposalRowProps {
  proposal: TabulationReportProposal
  index: number
}

function ProposalRow({ proposal, index }: ProposalRowProps) {
  const total = proposal.totalShares
  const forPct = pct(proposal.votesFor, total)
  const againstPct = pct(proposal.votesAgainst, total)
  const abstainPct = pct(proposal.votesAbstain, total)
  const notCastPct = pct(proposal.votesNotCast, total)
  const votedPct = pct(
    proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain,
    total
  )

  const isEven = index % 2 === 0

  return (
    <Section
      style={{
        backgroundColor: isEven ? COLORS.white : '#F9FAFB',
        padding: '16px 32px',
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Proposal header */}
      <Row>
        <Column>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '12px',
              color: COLORS.muted,
              margin: '0 0 2px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Proposal {proposal.number}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '14px',
              fontWeight: '600',
              color: COLORS.text,
              margin: '0 0 12px',
              lineHeight: '1.4',
            }}
          >
            {proposal.title}
          </Text>
        </Column>
        <Column align="right" style={{ verticalAlign: 'top', paddingTop: '4px' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '12px',
              color: COLORS.muted,
              margin: 0,
            }}
          >
            {votedPct}% voted
          </Text>
        </Column>
      </Row>

      {/* Vote bars */}
      <Row style={{ marginBottom: '6px' }}>
        <Column style={{ width: '25%', paddingRight: '8px' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              color: '#447A44',
              fontWeight: '600',
              margin: '0 0 2px',
            }}
          >
            FOR {forPct}%
          </Text>
          <ProgressBar percent={forPct} color="#447A44" />
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '10px',
              color: COLORS.muted,
              margin: '2px 0 0',
            }}
          >
            {formatNumber(proposal.votesFor)}
          </Text>
        </Column>
        <Column style={{ width: '25%', paddingRight: '8px' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              color: '#B91C1C',
              fontWeight: '600',
              margin: '0 0 2px',
            }}
          >
            AGAINST {againstPct}%
          </Text>
          <ProgressBar percent={againstPct} color="#DC2626" />
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '10px',
              color: COLORS.muted,
              margin: '2px 0 0',
            }}
          >
            {formatNumber(proposal.votesAgainst)}
          </Text>
        </Column>
        <Column style={{ width: '25%', paddingRight: '8px' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              color: '#92400E',
              fontWeight: '600',
              margin: '0 0 2px',
            }}
          >
            ABSTAIN {abstainPct}%
          </Text>
          <ProgressBar percent={abstainPct} color="#D97706" />
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '10px',
              color: COLORS.muted,
              margin: '2px 0 0',
            }}
          >
            {formatNumber(proposal.votesAbstain)}
          </Text>
        </Column>
        <Column style={{ width: '25%' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              color: COLORS.muted,
              fontWeight: '600',
              margin: '0 0 2px',
            }}
          >
            NOT CAST {notCastPct}%
          </Text>
          <ProgressBar percent={notCastPct} color="#D1D5DB" />
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '10px',
              color: COLORS.muted,
              margin: '2px 0 0',
            }}
          >
            {formatNumber(proposal.votesNotCast)}
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

export function TabulationReportEmail({
  companyName,
  meetingType,
  meetingDate,
  reportDate,
  daysUntilMeeting,
  recipientName,
  proposals,
  totalSharesEligible,
  totalSharesVoted,
  quorumRequired,
  quorumMet,
  viewTabulationUrl,
  portalBaseUrl,
}: TabulationReportEmailProps) {
  const quorumPct = pct(totalSharesVoted, totalSharesEligible)
  const quorumColor = quorumMet
    ? '#447A44'
    : quorumPct >= quorumRequired - 10
      ? '#D97706'
      : '#DC2626'

  const urgencyLabel =
    daysUntilMeeting <= 3
      ? '⚠️ Meeting in 3 days or less — final push required'
      : daysUntilMeeting <= 7
        ? `${daysUntilMeeting} days remaining — increase solicitation efforts`
        : `${daysUntilMeeting} days until meeting`

  return (
    <Layout
      preview={`Daily Tabulation Report — ${companyName} · ${daysUntilMeeting}d until meeting`}
    >
      <Container
        style={{
          maxWidth: CONTAINER_WIDTH,
          margin: '0 auto',
          border: '1px solid #CCCCCC',
        }}
      >
        {/* Header */}
        <Section style={{ backgroundColor: COLORS.navy, padding: '20px 32px' }}>
          <Row>
            <Column>
              <Text
                style={{
                  color: COLORS.white,
                  fontFamily: FONTS.sans,
                  fontSize: '15px',
                  fontWeight: '700',
                  margin: '0 0 2px',
                  lineHeight: '1.3',
                }}
              >
                {companyName}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.75)',
                  fontFamily: FONTS.sans,
                  fontSize: '12px',
                  margin: 0,
                }}
              >
                {meetingType} &bull; Daily Tabulation Report
              </Text>
            </Column>
            <Column align="right" style={{ verticalAlign: 'middle' }}>
              <BNLogo />
            </Column>
          </Row>
        </Section>

        {/* Urgency banner */}
        <Section
          style={{
            backgroundColor:
              daysUntilMeeting <= 3
                ? '#FEF2F2'
                : daysUntilMeeting <= 7
                  ? '#FFFBEB'
                  : '#EFF6FF',
            borderBottom: `1px solid ${daysUntilMeeting <= 3 ? '#FECACA' : daysUntilMeeting <= 7 ? '#FDE68A' : '#BFDBFE'}`,
            padding: '10px 32px',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '12px',
              color:
                daysUntilMeeting <= 3
                  ? '#991B1B'
                  : daysUntilMeeting <= 7
                    ? '#92400E'
                    : '#1E40AF',
              margin: 0,
              fontWeight: '500',
            }}
          >
            {urgencyLabel} &bull; Meeting date: {formatDate(meetingDate)}
          </Text>
        </Section>

        {/* Greeting */}
        <Section style={{ backgroundColor: COLORS.white, padding: '24px 32px 0' }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '14px',
              color: COLORS.text,
              margin: '0 0 6px',
            }}
          >
            Hello {recipientName},
          </Text>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '14px',
              color: COLORS.textLight,
              margin: '0 0 0',
              lineHeight: '1.6',
            }}
          >
            Here is your automated daily vote tabulation summary for{' '}
            <strong>{companyName}</strong>, as of {formatDate(reportDate)}.
          </Text>
        </Section>

        {/* Quorum status */}
        <Section style={{ backgroundColor: COLORS.white, padding: '20px 32px' }}>
          <div
            style={{
              border: `1px solid ${quorumMet ? '#447A44' : '#FEE2E2'}`,
              borderRadius: '8px',
              backgroundColor: quorumMet ? '#f0faf0' : '#FFF5F5',
              padding: '16px 20px',
            }}
          >
            <Row>
              <Column style={{ width: '60%' }}>
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: '11px',
                    color: COLORS.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    margin: '0 0 4px',
                    fontWeight: '600',
                  }}
                >
                  Quorum Status
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: '22px',
                    fontWeight: '700',
                    color: quorumColor,
                    margin: '0 0 2px',
                    lineHeight: '1.2',
                  }}
                >
                  {quorumPct}%{' '}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '400',
                      color: COLORS.muted,
                    }}
                  >
                    of eligible shares voted
                  </span>
                </Text>
                <ProgressBar percent={quorumPct} color={quorumColor} />
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: '11px',
                    color: COLORS.muted,
                    margin: '4px 0 0',
                  }}
                >
                  {formatNumber(totalSharesVoted)} of {formatNumber(totalSharesEligible)}{' '}
                  shares &bull; {quorumRequired}% threshold required
                </Text>
              </Column>
              <Column style={{ width: '40%' }} align="right">
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: quorumMet ? '#16A34A' : '#DC2626',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    marginTop: '8px',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: '12px',
                      fontWeight: '700',
                      color: COLORS.white,
                      margin: 0,
                    }}
                  >
                    {quorumMet ? '✓ Quorum Met' : '✗ Below Quorum'}
                  </Text>
                </div>
                {!quorumMet && (
                  <Text
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: '11px',
                      color: '#DC2626',
                      margin: '6px 0 0',
                      textAlign: 'right',
                    }}
                  >
                    Need{' '}
                    {formatNumber(
                      Math.ceil(
                        (quorumRequired / 100) * totalSharesEligible - totalSharesVoted
                      )
                    )}{' '}
                    more shares
                  </Text>
                )}
              </Column>
            </Row>
          </div>
        </Section>

        {/* Proposals section header */}
        <Section
          style={{
            backgroundColor: '#F3F4F6',
            padding: '10px 32px',
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              fontWeight: '700',
              color: COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: 0,
            }}
          >
            Vote Breakdown by Proposal ({proposals.length} total)
          </Text>
        </Section>

        {/* Proposal rows */}
        {proposals.map((p, i) => (
          <ProposalRow key={p.number} proposal={p} index={i} />
        ))}

        <Hr style={{ borderColor: COLORS.border, margin: 0 }} />

        {/* CTA */}
        <Section
          style={{
            backgroundColor: COLORS.white,
            padding: '24px 32px',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '13px',
              color: COLORS.textLight,
              margin: '0 0 16px',
            }}
          >
            View full tabulation details, position-level breakdowns, and manage
            distribution settings in the portal.
          </Text>
          <Button
            href={viewTabulationUrl}
            style={{
              backgroundColor: COLORS.navy,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 28px',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            View Full Tabulation Report →
          </Button>
        </Section>

        {/* Automated notice */}
        <Section
          style={{
            backgroundColor: '#F9FAFB',
            borderTop: `1px solid ${COLORS.border}`,
            padding: '12px 32px',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: '11px',
              color: COLORS.muted,
              margin: 0,
              textAlign: 'center',
            }}
          >
            This is an automated daily report. Distribution begins 15 days before the
            meeting date. To manage recipients or pause delivery, visit your{' '}
            <a href={viewTabulationUrl} style={{ color: COLORS.link }}>
              tabulation settings
            </a>
            .
          </Text>
        </Section>

        <Footer portalBaseUrl={portalBaseUrl} />
      </Container>
    </Layout>
  )
}

export default TabulationReportEmail
