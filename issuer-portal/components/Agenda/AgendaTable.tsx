'use client'

import React from 'react'

import { Upload as UploadIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'

interface AgendaTableProps {
  onUploadClick?: () => void
}

export default function AgendaTable({ onUploadClick }: AgendaTableProps) {
  const { currentMeeting } = useMeeting()
  const { proposals } = useVotingTabulation(currentMeeting?.id)

  // Default vote options for most proposals
  const getVoteOptions = (proposalType?: string, proposalNumber?: string) => {
    // Check if it's a director election (typically proposals 1-3 or contains "Election" in type)
    const isDirectorElection =
      proposalType?.toLowerCase().includes('election') ||
      proposalType?.toLowerCase().includes('director') ||
      (proposalNumber && ['1', '2', '3'].includes(proposalNumber))

    if (isDirectorElection) {
      return 'FOR / WITHHOLD'
    }
    return 'FOR / AGAINST / ABSTAIN'
  }

  return (
    <Card>
      <CardHeader
        title="Meeting Agenda"
        action={
          onUploadClick && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={onUploadClick}
            >
              Upload More
            </Button>
          )
        }
        sx={{
          backgroundColor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      />
      <CardContent sx={{ p: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Proposals
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '300px' }}>
                Vote Options
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals && proposals.length > 0 ? (
              <>
                {/* Count director proposals for the header */}
                {(() => {
                  const directorProposals = proposals.filter(
                    (p) => p.proposalNumber.toString().startsWith('1.') && p.directorName
                  )
                  const hasDirectorElections = directorProposals.length > 0

                  return (
                    <>
                      {/* Add header row for director elections if we have them */}
                      {hasDirectorElections && (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            sx={{
                              backgroundColor: 'action.hover',
                              py: 1.5,
                              fontWeight: 600,
                            }}
                          >
                            <Typography fontWeight={600}>
                              1. Election of the {directorProposals.length} directors
                              named in the accompanying Proxy Statement
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Render all proposals, filtering out proposal 1 if we have sub-proposals */}
                      {proposals
                        .filter((proposal) => {
                          // If we have director sub-proposals (1.01, 1.02, etc), don't show proposal 1
                          if (
                            hasDirectorElections &&
                            proposal.proposalNumber.toString() === '1'
                          ) {
                            return false
                          }
                          return true
                        })
                        .map((proposal, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <TableCell>
                              <Box>
                                <Box
                                  display={'flex'}
                                  alignItems="center"
                                  gap={0.5}
                                  sx={{
                                    pl: proposal.proposalNumber.toString().includes('.')
                                      ? 3
                                      : 0,
                                  }}
                                >
                                  <Typography fontWeight={600}>
                                    {proposal.proposalNumber}
                                  </Typography>
                                  <Typography color="text.primary">
                                    {proposal.directorName || proposal.proposalTitle}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {getVoteOptions(
                                  proposal.proposalType,
                                  proposal.proposalNumber.toString()
                                )
                                  .split(' / ')
                                  .map((option) => (
                                    <Chip
                                      key={option}
                                      label={option}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </>
                  )
                })()}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No proposals available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
