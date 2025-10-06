'use client'

import React, { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'

import { Refresh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Tabs,
  Tab,
  Snackbar,
  Typography
} from '@mui/material'


import EmptyState from '@/components/EmptyState'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'
import PreviewDialog, { createTextRenderer } from '@/components/FileUpload/PreviewDialog'
import { DSMParticipants } from '@/components/Meeting/DigitalShareholderMeeting/DSMParticipants'
import { DSMGuestRegistrants } from '@/components/Meeting/DigitalShareholderMeeting/DSMGuestRegistrants'
import { DSMActualAttendees } from '@/components/Meeting/DigitalShareholderMeeting/DSMActualAttendees'

import { useMeeting } from '@/contexts/MeetingContext'
import { useDigitalShareholderMeeting } from '@/hooks/useDigitalShareholderMeeting'

type ExcelRow = Record<string, string | number | boolean | Date | undefined>;

interface ParsedParticipant {
  firstName: string
  lastName: string
  emailAddress: string
  title?: string
  department?: string
  documentName?: string
}

// Function to parse CSV or Excel files
const parseFile = async (file: File): Promise<ParsedParticipant[]> => {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file) {
      reject(new Error('No file provided'))
      return
    }

    if (file.size === 0) {
      reject(new Error('File is empty'))
      return
    }

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ]

    const validExtensions = ['.csv', '.xls', '.xlsx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      reject(new Error('Invalid file type. Please upload a CSV or Excel file.'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Failed to read file data'))
          return
        }

        const workbook = XLSX.read(data, { type: 'array' })

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('No worksheets found in the file'))
          return
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        if (!firstSheet) {
          reject(new Error('Failed to read worksheet data'))
          return
        }

        let jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(firstSheet)

        if (jsonData.length === 0) {
          reject(new Error('The file is empty or has no data rows'))
          return
        }

        // Check if the first row contains header information in the data
        const firstRow = jsonData[0]
        const firstRowValues = Object.values(firstRow).map((v) => String(v).toLowerCase())

        // If first row contains "first name", "last name", etc., it's a header row
        if (firstRowValues.some((v) => v.includes('first name') || v.includes('email'))) {
          const range = XLSX.utils.decode_range(firstSheet['!ref'] ?? 'A1')

          // Find the row that contains the actual headers by checking each row
          let headerRowIndex = -1
          for (let R = 0; R <= Math.min(5, range.e.r); ++R) {
            const rowValues = []
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
              const cell = firstSheet[cellAddress] as { v?: string | number } | undefined
              if (cell?.v) rowValues.push(String(cell.v).toLowerCase())
            }
            // Check if this row has "first name", "last name", and "email"
            if (
              rowValues.some((v) => v.includes('first name')) &&
              rowValues.some((v) => v.includes('email'))
            ) {
              headerRowIndex = R
              break
            }
          }

          if (headerRowIndex >= 0) {
            // Get headers from the header row
            const headers: string[] = []
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C })
              const cell = firstSheet[cellAddress] as { v?: string | number } | undefined
              headers.push(cell?.v ? String(cell.v) : '')
            }

            // Parse data rows (starting after header row)
            jsonData = []
            for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
              const row: ExcelRow = {}
              let hasData = false
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
                const cell = firstSheet[cellAddress] as { v?: string | number | boolean | Date } | undefined
                row[headers[C]] = cell?.v ?? ''
                if (cell?.v) hasData = true
              }
              // Only add rows that have some data
              if (hasData) jsonData.push(row)
            }
          }
        }

        // Map the data to our format
        const mappedData = jsonData
          .map((row: ExcelRow) => {
            const firstName = row['First Name'] ?? ''
            const lastName = row['Last Name'] ?? ''
            const emailAddress = row['Email Address'] ?? ''
            const title = row.Title ?? ''
            const department = row.Department ?? ''
            const documentName = row['Document Name'] ?? ''

            // Skip rows without required fields
            if (!firstName || !lastName || !emailAddress) {
              return null
            }

            const parsedParticipant: ParsedParticipant = {
              firstName: String(firstName),
              lastName: String(lastName),
              emailAddress: String(emailAddress),
            }

            // Only add optional fields if they have values
            if (title) {
              parsedParticipant.title = String(title)
            }
            if (department) {
              parsedParticipant.department = String(department)
            }
            if (documentName) {
              parsedParticipant.documentName = String(documentName)
            }

            return parsedParticipant
          })
          .filter((item): item is ParsedParticipant => item !== null)

        if (mappedData.length === 0) {
          const sampleRow = jsonData[0]
          const availableColumns = Object.keys(sampleRow).join(', ')
          reject(
            new Error(
              `No valid rows found. Expected columns: "First Name", "Last Name", "Email Address". ` +
              `Found columns: ${availableColumns}`
            )
          )
          return
        }

        resolve(mappedData)
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }

    reader.onerror = () => {
      const error = reader.error ?? new Error('Failed to read file')
      reject(new Error(`File reading failed: ${error.message ?? 'Unknown error'}`))
    }

    reader.readAsArrayBuffer(file)
  })
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dsm-tabpanel-${index}`}
      aria-labelledby={`dsm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `dsm-tab-${index}`,
    'aria-controls': `dsm-tabpanel-${index}`,
  }
}

export default function DigitalShareholderMeetingPage() {
  const meetingContext = useMeeting()
  const currentMeeting = meetingContext.currentMeeting
  const digitalMeetingData = useDigitalShareholderMeeting(currentMeeting?.id) as {
    attendees: unknown[]
    error: unknown
    isLoading: boolean
    uploadAttendees: (attendees: unknown[]) => Promise<unknown>
  }
  const attendees = digitalMeetingData.attendees
  const error = digitalMeetingData.error
  const isLoading = digitalMeetingData.isLoading
  const uploadAttendees = digitalMeetingData.uploadAttendees
  const [activeTab, setActiveTab] = useState(0)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedParticipant[] | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleUploadClick = () => {
    setUploadDialogOpen(true)
  }

  const handleFileUpload = useCallback(
    async (files: File[], _associations?: Record<string, string>) => {
      if (!currentMeeting?.id || files.length === 0) return

      setUploadError(null)
      setUploadSuccess(false)

      try {
        const file = files[0]
        const parsedData = await parseFile(file)

        if (parsedData.length === 0) {
          throw new Error('No valid data found in file')
        }

        // Show preview dialog
        setPreviewData(parsedData)
        setPreviewDialogOpen(true)
        setUploadDialogOpen(false)
      } catch (error) {
        console.error('Upload error:', error)
        setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
      }
    },
    [currentMeeting?.id]
  )

  const handleConfirmUpload = useCallback(async () => {
    if (!previewData) return

    try {
      // Map presenter data to expected format
      const mappedData = previewData.map(presenter => ({
        registrantType: 'Presenter',
        firstName: presenter.firstName,
        lastName: presenter.lastName,
        emailAddress: presenter.emailAddress,
        registrationQuestions: `${presenter.title ?? ''} - ${presenter.department ?? ''}`.trim(),
        minutesAttendedMeeting: 0,
      }))

      await uploadAttendees(mappedData)
      setUploadSuccess(true)
      setPreviewDialogOpen(false)
      setPreviewData(null)

      // Show success message briefly
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }, [previewData, uploadAttendees])

  const handleCancelPreview = useCallback(() => {
    setPreviewDialogOpen(false)
    setPreviewData(null)
    setUploadDialogOpen(true)
  }, [])



  const hasAttendees = attendees && attendees.length > 0

  if (isLoading) {
    return (
      <LinearProgress />
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <EmptyState
          title="Error Loading DSM Data"
          description="There was an error loading the Digital Shareholder Meeting data. Please try refreshing the page."
          action={
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          }
        />
      </Container>
    )
  }

  if (!hasAttendees) {
    return (
      <>
        <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
          <EmptyState
            title="No digital meeting attendees yet — add attendees to get started"
            action={
              <Button
                variant="contained"
                onClick={handleUploadClick}
              >
                Add Attendees
              </Button>
            }
          >
            <Typography component="span" variant="body3">
              Upload attendee data to get started. Your file must include these columns:
              <span> <strong>First Name</strong> (required), <strong>Last Name</strong> (required), <strong>Email Address</strong> (required), Title (optional). </span>
            </Typography>
            <Typography component="span" variant="body3">Accepted formats: CSV, Excel (.csv, .xls, .xlsx)</Typography>
          </EmptyState>
        </Container>

        {/* File Upload Dialog - Available even when no data */}
        <FileUploadDialog
          open={uploadDialogOpen}
          onClose={() => {
            setUploadDialogOpen(false)
            setUploadError(null)
            setUploadSuccess(false)
          }}
          onUpload={handleFileUpload}
          meetingId={currentMeeting?.id ?? ''}
          documentType="digital-shareholder-meeting"
        />

        {/* Preview Dialog - Available even when no data */}
        <PreviewDialog
          open={previewDialogOpen}
          onClose={handleCancelPreview}
          onConfirm={handleConfirmUpload}
          data={previewData}
          title="Confirm Upload"
          columns={[
            {
              key: 'firstName',
              label: 'Name',
              render: (_, row) => createTextRenderer()(`${row.firstName} ${row.lastName}`),
            },
            {
              key: 'emailAddress',
              label: 'Email',
              render: createTextRenderer(),
            },
            {
              key: 'title',
              label: 'Title',
              render: createTextRenderer(),
            },
            {
              key: 'department',
              label: 'Department',
              render: createTextRenderer(),
            },
          ]}
        />
      </>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>

      {/* Tabbed Interface */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="DSM management sections"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Participants" {...a11yProps(0)} />
          <Tab label="Guest Registrants" {...a11yProps(1)} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <DSMParticipants meetingId={currentMeeting?.id ?? ''} />
        {hasAttendees && (
          <DSMActualAttendees meetingId={currentMeeting?.id ?? ''} />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <DSMGuestRegistrants meetingId={currentMeeting?.id ?? ''} />
      </TabPanel>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false)
          setUploadError(null)
          setUploadSuccess(false)
        }}
        onUpload={handleFileUpload}
        meetingId={currentMeeting?.id ?? ''}
        documentType="digital-shareholder-meeting"
      />

      {/* Error and Success Alerts */}
      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Snackbar
          open={uploadSuccess}
          autoHideDuration={6000}
          onClose={() => setUploadSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setUploadSuccess(false)}>
            Participants uploaded successfully!
          </Alert>
        </Snackbar>
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewDialogOpen}
        onClose={handleCancelPreview}
        onConfirm={handleConfirmUpload}
        data={previewData}
        title="Confirm Upload"
        columns={[
          {
            key: 'firstName',
            label: 'Name',
            render: (_, row) => createTextRenderer()(`${row.firstName} ${row.lastName}`),
          },
          {
            key: 'emailAddress',
            label: 'Email',
            render: createTextRenderer(),
          },
          {
            key: 'title',
            label: 'Title',
            render: createTextRenderer(),
          },
          {
            key: 'department',
            label: 'Department',
            render: createTextRenderer(),
          },
        ]}
      />
    </Container>
  )
}
