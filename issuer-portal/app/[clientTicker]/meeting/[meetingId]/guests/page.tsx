'use client'

import React, { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'

import { FileUploadOutlined } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import EmptyState from '@/components/EmptyState'
import FileUploadDialog from '@/components/FileUpload/FileUploadDialog'

import { useMeeting } from '@/contexts/MeetingContext'
import { useDigitalShareholderMeeting } from '@/hooks/useDigitalShareholderMeeting'

interface DigitalShareholderMeetingAttendee {
  id: string
  meetingId: string
  registrantType: 'Shareholder' | 'Guest' | 'Proxy' | 'Other'
  firstName: string
  lastName: string
  emailAddress: string
  registrationQuestions?: string
  minutesAttendedMeeting?: number
  createdAt: string
  updatedAt: string
}

type ExcelRow = Record<string, string | number | boolean | Date | undefined>;

interface ParsedAttendee {
  registrantType: string
  firstName: string
  lastName: string
  emailAddress: string
  registrationQuestions?: string
  minutesAttendedMeeting?: number
}

// Function to parse CSV or Excel files
const parseFile = async (file: File): Promise<ParsedAttendee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
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
              const cell = firstSheet[cellAddress] as XLSX.CellObject | undefined
              if (cell?.v !== undefined) rowValues.push(String(cell.v).toLowerCase())
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
              const cell = firstSheet[cellAddress] as XLSX.CellObject | undefined
              headers.push(cell?.v !== undefined ? String(cell.v) : '')
            }

            // Parse data rows (starting after header row)
            jsonData = []
            for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
              const row: ExcelRow = {}
              let hasData = false
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
                const cell = firstSheet[cellAddress] as XLSX.CellObject | undefined
                row[headers[C]] = cell?.v !== undefined ? cell.v : ''
                if (cell?.v !== undefined) hasData = true
              }
              // Only add rows that have some data
              if (hasData) jsonData.push(row)
            }
          }
        }

        // Map the data to our format
        const mappedData = jsonData
          .map((row: ExcelRow) => {
            const registrantType = row['Registrant Type'] ?? 'Shareholder'
            const firstName = row['First Name'] ?? ''
            const lastName = row['Last Name'] ?? ''
            const emailAddress = row['Email Address'] ?? ''
            const registrationQuestions =
              row['Registration (Pre-Meeting) Questions'] ?? ''
            const minutesAttendedMeeting =
              typeof row['Minutes Attended Meeting'] === 'number'
                ? row['Minutes Attended Meeting']
                : parseInt(row['Minutes Attended Meeting'] as string) || 0

            // Skip rows without required fields
            if (!firstName || !lastName || !emailAddress) {
              return null
            }

            const parsedAttendee: ParsedAttendee = {
              registrantType: String(registrantType),
              firstName: String(firstName),
              lastName: String(lastName),
              emailAddress: String(emailAddress),
            }

            // Only add optional fields if they have values
            if (registrationQuestions) {
              parsedAttendee.registrationQuestions = String(registrationQuestions)
            }

            if (minutesAttendedMeeting) {
              parsedAttendee.minutesAttendedMeeting = minutesAttendedMeeting
            }

            return parsedAttendee
          })
          .filter((item): item is ParsedAttendee => item !== null)

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
        reject(error instanceof Error ? error : new Error('Failed to parse file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export default function GuestsPage() {
  const { currentMeeting } = useMeeting()
  const { attendees, error, isLoading, uploadAttendees } = useDigitalShareholderMeeting(
    currentMeeting?.id
  )
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [previewData, setPreviewData] = useState<ParsedAttendee[] | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  const handleFileUpload = useCallback(
    async (files: File[]) => {
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
      await uploadAttendees(previewData)
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

  const getRegistrantTypeColor = (type: string) => {
    switch (type) {
      case 'Shareholder':
        return 'primary'
      case 'Proxy':
        return 'secondary'
      case 'Guest':
        return 'info'
      default:
        return 'default'
    }
  }

  const hasAttendees = attendees && attendees.length > 0

  if (isLoading) {
    return <LinearProgress />
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
        <Alert severity="error">Failed to load attendees data</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ my: { xs: 2, md: 3 } }}>
      {!hasAttendees ? (
        <EmptyState
          title="No Digital Meeting Attendees"
          description="Upload a CSV or Excel file containing your digital shareholder meeting attendee data"
          action={
            <Button
              variant="contained"
              startIcon={<FileUploadOutlined />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Attendees
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader
            title="Digital Shareholder Meeting Attendees"
            subheader={`${attendees.length} attendees registered`}
            action={
              <Button
                variant="contained"
                startIcon={<FileUploadOutlined />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload
              </Button>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Registrant Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendees.map((attendee: DigitalShareholderMeetingAttendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <Chip
                        label={attendee.registrantType}
                        color={getRegistrantTypeColor(attendee.registrantType)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body3">
                        {attendee.firstName} {attendee.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body3" color="text.secondary">
                        {attendee.emailAddress}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false)
          setUploadError(null)
          setUploadSuccess(false)
        }}
        onUpload={handleFileUpload}
        meetingId={currentMeeting?.id}
        documentType="digital-shareholder-meeting"
      />

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Attendees uploaded successfully!
        </Alert>
      )}

      <Dialog
        open={previewDialogOpen}
        onClose={handleCancelPreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Confirm Upload - {previewData?.length ?? 0} Attendees</DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Registrant Type</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.registrantType}</TableCell>
                    <TableCell>{row.firstName}</TableCell>
                    <TableCell>{row.lastName}</TableCell>
                    <TableCell>{row.emailAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPreview}>Cancel</Button>
          <Button onClick={handleConfirmUpload} variant="contained">
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
