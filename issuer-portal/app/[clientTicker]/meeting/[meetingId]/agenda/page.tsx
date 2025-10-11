'use client'

import TeamPyramidIcon from '@rolemodel/betanxt-design-system/components/icons/brand/TeamPyramidIcon'
import React, { useState } from 'react'
import * as XLSX from 'xlsx'

import { FileUploadOutlined } from '@mui/icons-material'
import { Button, Container } from '@mui/material'

import AgendaTable from '@/components/Agenda/AgendaTable'
import EmptyState from '@/components/EmptyState'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'

import { useMeeting } from '@/contexts/MeetingContext'
import { useVotingTabulation } from '@/hooks/useVotingTabulation'

interface ExcelRow {
  'Proposal Number'?: string | number
  Number?: string | number
  'Proposal Title'?: string
  Title?: string
  'Proposal Type'?: string
  Type?: string
  'Proposal Subtype'?: string
  Subtype?: string
  'Director Name'?: string
  Director?: string
  Recommendation?: string
}

interface ParsedProposal {
  proposalNumber: number
  proposalTitle: string
  proposalType: string
  proposalSubtype?: string
  directorName?: string
  recommendation: string
}

export default function AgendaPage() {
  const { currentMeeting, isLoading: meetingLoading } = useMeeting()
  const { proposals, uploadProposals } = useVotingTabulation(currentMeeting?.id ?? '')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  // Parse Excel/CSV file for agenda proposals
  const parseAgendaFile = async (file: File): Promise<ParsedProposal[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet)

          if (jsonData.length === 0) {
            reject(new Error('The file is empty or has no data rows'))
            return
          }

          // Map the data to our format
          const mappedData = jsonData
            .map((row: ExcelRow) => {
              const proposalNumber = row['Proposal Number'] ?? row.Number ?? ''
              const proposalTitle = row['Proposal Title'] ?? row.Title ?? ''
              const proposalType = row['Proposal Type'] ?? row.Type ?? ''
              const proposalSubtype = row['Proposal Subtype'] ?? row.Subtype ?? ''
              const directorName = row['Director Name'] ?? row.Director ?? ''
              const recommendation = row.Recommendation ?? ''

              // Skip rows without required fields
              if (!proposalNumber || !proposalTitle) {
                return null
              }

              const parsedProposal: ParsedProposal = {
                proposalNumber:
                  typeof proposalNumber === 'number'
                    ? proposalNumber
                    : parseFloat(proposalNumber) || 0,
                proposalTitle: String(proposalTitle),
                proposalType: String(proposalType),
                recommendation: String(recommendation),
              }

              if (proposalSubtype) {
                parsedProposal.proposalSubtype = String(proposalSubtype)
              }

              if (directorName) {
                parsedProposal.directorName = String(directorName)
              }

              return parsedProposal
            })
            .filter((item): item is ParsedProposal => item !== null)

          if (mappedData.length === 0) {
            reject(new Error('No valid proposal data found in file'))
            return
          }

          resolve(mappedData)
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to parse file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0 || !currentMeeting?.id) return

    try {
      const file = files[0]
      // Parse and upload as proposals
      const proposals = await parseAgendaFile(file)
      await uploadProposals(proposals)
      setUploadDialogOpen(false)
    } catch (error) {
      console.error('Failed to upload agenda:', error)
      throw error
    }
  }

  // Show loading state while data is being fetched
  if (meetingLoading) {
    return null
  }

  const hasProposals = proposals && proposals.length > 0

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      {!hasProposals ? (
        <EmptyState
          title="Meeting Agenda"
          description="Upload a CSV or Excel file containing your meeting agenda proposals"
          icon={<TeamPyramidIcon />}
          action={
            <Button
              variant="contained"
              startIcon={<FileUploadOutlined />}
              onClick={handleUploadClick}
            >
              Upload Agenda
            </Button>
          }
        />
      ) : (
        <AgendaTable onUploadClick={handleUploadClick} />
      )}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleFileUpload}
        onUploadSuccess={() => setUploadDialogOpen(false)}
        meetingId={currentMeeting?.id}
      />
    </Container>
  )
}
