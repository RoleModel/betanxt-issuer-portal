'use client'

import React, { useState } from 'react'

import FilterListIcon from '@mui/icons-material/FilterList'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import InputAdornment from '@mui/material/InputAdornment'

import NoWrapTableCell from '@/components/ui/NoWrapTableCell'
import SROnlyTableCaption from '@/components/ui/SROnlyTableCaption'
import SortableHeaderCell, { useSortableTable } from '@/components/ui/SortableHeaderCell'

import buildApiClient from '@/domain-models/apiClient'

import { exportPositionsToPdf } from '@/utils/exportPositionsPdf'
import { asArray, asRecord, asString } from '@/utils/typeUtils'

interface Position {
  cusip: string
  accountType: string
  setKey: string
  name: string
  accountNumber: string
  voteStatus: string
  controlNumber: string
  shares: number
  sharesVoted: number
  source: string
  dateVoted: string | null
  sentBy: string | null
}

interface PositionsTableProps {
  meetingId: string
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const str = asString(value)
  return str ?? String(value)
}

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const str = asString(value)
  return str ?? String(value)
}

const normalizePosition = (value: unknown): Position | null => {
  const record = asRecord(value)
  if (!record) return null

  return {
    cusip: toStringValue(record.cusip),
    accountType: toStringValue(record.accountType),
    setKey: toStringValue(record.setKey),
    name: toStringValue(record.name),
    accountNumber: toStringValue(record.accountNumber),
    voteStatus: toStringValue(record.voteStatus),
    controlNumber: toStringValue(record.controlNumber),
    shares: toFiniteNumber(record.shares),
    sharesVoted: toFiniteNumber(record.sharesVoted),
    source: toStringValue(record.votingSource),
    dateVoted: toNullableString(record.dateVoted),
    sentBy: toNullableString(record.sentBy),
  }
}

export default function PositionsTable({ meetingId }: PositionsTableProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [clientTicker, setClientTicker] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // Advanced filter states
  const [filterPositionType, setFilterPositionType] = useState('')
  const [filterAccountTypes, setFilterAccountTypes] = useState<string[]>([])
  const [filterVoteStatus, setFilterVoteStatus] = useState('All')
  const [filterControlNumber, setFilterControlNumber] = useState('')
  const [filterAccountNumber, setFilterAccountNumber] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filterShareLow, setFilterShareLow] = useState('')
  const [filterShareHigh, setFilterShareHigh] = useState('')

  const { sortColumn, sortDirection, handleSort, sortData } = useSortableTable<Position>()

  React.useEffect(() => {
    if (!meetingId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const apiClient = await buildApiClient()

        // Fetch positions
        const { data: positionsData, error: positionsError } = await apiClient.GET(
          '/positions',
          {
            params: {
              query: { meetingId },
            },
          }
        )

        if (positionsError) {
          console.error('Failed to fetch positions:', positionsError)
          return
        }

        if (positionsData) {
          const rawData: unknown[] = Array.isArray(positionsData)
            ? positionsData
            : asArray(asRecord(positionsData)?.positions)

          const positionsList = rawData.reduce<Position[]>((acc, item) => {
            const normalized = normalizePosition(item)
            if (normalized) acc.push(normalized)
            return acc
          }, [])

          setPositions(positionsList)
        }

        // Try to fetch meeting data for title and client ticker
        try {
          const { data: meetingData, error: meetingError } = await apiClient.GET(
            '/meetings/{meetingId}',
            {
              params: {
                path: { meetingId },
              },
            }
          )

          if (!meetingError && meetingData) {
            const meeting = asRecord(meetingData)
            setMeetingTitle(asString(meeting?.title) || '')
            setClientTicker(asString(meeting?.ticker) || '')
          }
        } catch (_meetingErr) {
          // Meeting fetch is optional, set fallback values
          setMeetingTitle('Meeting Positions')
          setClientTicker('')
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [meetingId])

  const handleExportPdf = async () => {
    if (isExporting) return

    setIsExporting(true)
    try {
      await exportPositionsToPdf({
        positions: filteredPositions,
        meetingTitle: meetingTitle || 'Meeting Positions',
        clientTicker,
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true)
  }

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false)
  }

  const handleClearFilters = () => {
    setFilterPositionType('')
    setFilterAccountTypes([])
    setFilterVoteStatus('All')
    setFilterControlNumber('')
    setFilterAccountNumber('')
    setFilterName('')
    setFilterShareLow('')
    setFilterShareHigh('')
  }

  const handleApplyFilters = () => {
    setFilterDialogOpen(false)
  }

  const sortedPositions = sortData(positions)

  const filteredPositions = sortedPositions.filter((position) => {
    const matchesSearch =
      !searchQuery ||
      position.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.controlNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'All' || position.voteStatus === statusFilter

    // Advanced filters
    const matchesPositionType =
      !filterPositionType || position.setKey === filterPositionType
    const matchesAccountTypes =
      filterAccountTypes.length === 0 || filterAccountTypes.includes(position.accountType)
    const matchesVoteStatus =
      filterVoteStatus === 'All' || position.voteStatus === filterVoteStatus
    const matchesControlNumber =
      !filterControlNumber ||
      position.controlNumber.toLowerCase().includes(filterControlNumber.toLowerCase())
    const matchesAccountNumber =
      !filterAccountNumber ||
      position.accountNumber.toLowerCase().includes(filterAccountNumber.toLowerCase())
    const matchesName =
      !filterName || position.name.toLowerCase().includes(filterName.toLowerCase())

    const shareLow = filterShareLow ? parseFloat(filterShareLow) : null
    const shareHigh = filterShareHigh ? parseFloat(filterShareHigh) : null
    const matchesShareRange =
      (shareLow === null || position.shares >= shareLow) &&
      (shareHigh === null || position.shares <= shareHigh)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPositionType &&
      matchesAccountTypes &&
      matchesVoteStatus &&
      matchesControlNumber &&
      matchesAccountNumber &&
      matchesName &&
      matchesShareRange
    )
  })

  const paginatedPositions = filteredPositions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  const formatAccountType = (accountType: string): string => {
    // Map database values to display values from CSV
    if (accountType === 'DTC/CDS') {
      return 'CEDE & CO / CDS & CO'
    }
    if (accountType === 'Non-DTC') {
      return 'Registered Account'
    }
    return accountType
  }

  const formatDate = (date: string | null): string => {
    if (!date) return ''

    try {
      // Handle MM/DD/YYYY format with optional time
      let dateStr = date
      if (date.includes(' 12:00AM')) {
        dateStr = date.replace(' 12:00AM', '')
      }

      const parsedDate = new Date(dateStr)

      // Check if date is valid
      if (isNaN(parsedDate.getTime())) {
        // Try parsing as MM/DD/YYYY directly
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10)
          const day = parseInt(parts[1], 10)
          const year = parseInt(parts[2], 10)
          const altDate = new Date(year, month - 1, day)

          if (!isNaN(altDate.getTime())) {
            return altDate.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            })
          }
        }
        return ''
      }

      return parsedDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
    } catch (error) {
      return ''
    }
  }

  return (
    <Card>
      <CardHeader
        title="Positions"
        action={
          <Button
            variant="text"
            color="primary"
            onClick={handleExportPdf}
            loading={isExporting}
            loadingIndicator="Generating..."
            disabled={isExporting}
          >
            Export Positions
          </Button>
        }
      />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search Positions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            displayEmpty
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Voted">Voted</MenuItem>
            <MenuItem value="Unvoted">Unvoted</MenuItem>
          </Select>
          <Button
            variant="text"
            startIcon={<FilterListIcon />}
            onClick={handleOpenFilterDialog}
          >
            Filters
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ tableLayout: 'fixed' }}>
            <SROnlyTableCaption>Positions Table</SROnlyTableCaption>
            <TableHead>
              <TableRow>
                <SortableHeaderCell
                  column="cusip"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Cusip
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="accountType"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Account Type
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="setKey"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Set Key
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="name"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Name
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="accountNumber"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Account #
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="voteStatus"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Vote Status
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="controlNumber"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Control #
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="shares"
                  align="right"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Shares
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="sharesVoted"
                  align="right"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Shares Voted
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="source"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Source
                </SortableHeaderCell>
                <SortableHeaderCell
                  column="dateVoted"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Date Voted
                </SortableHeaderCell>
                <NoWrapTableCell align="right">Sent by</NoWrapTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: rowsPerPage }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <NoWrapTableCell key={j}>
                        <Skeleton />
                      </NoWrapTableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography variant="body3" color="text.secondary" sx={{ py: 4 }}>
                      No positions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPositions.map((position, index) => (
                  <TableRow key={index}>
                    <NoWrapTableCell>{position.cusip}</NoWrapTableCell>
                    <NoWrapTableCell>
                      {formatAccountType(position.accountType)}
                    </NoWrapTableCell>
                    <NoWrapTableCell>{position.setKey}</NoWrapTableCell>
                    <NoWrapTableCell>{position.name}</NoWrapTableCell>
                    <NoWrapTableCell>{position.accountNumber}</NoWrapTableCell>
                    <NoWrapTableCell>{position.voteStatus}</NoWrapTableCell>
                    <NoWrapTableCell>{position.controlNumber}</NoWrapTableCell>
                    <NoWrapTableCell align="right">
                      {formatNumber(position.shares)}
                    </NoWrapTableCell>
                    <NoWrapTableCell align="right">
                      {formatNumber(position.sharesVoted)}
                    </NoWrapTableCell>
                    <NoWrapTableCell>{position.source}</NoWrapTableCell>
                    <NoWrapTableCell>{formatDate(position.dateVoted)}</NoWrapTableCell>
                    <TableCell align="right">
                      {position.sentBy ? (
                        <MailOutlineIcon fontSize="small" />
                      ) : (
                        <InsertDriveFileOutlinedIcon fontSize="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredPositions.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </CardContent>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={handleCloseFilterDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Filter Positions</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Position Type"
                value={filterPositionType}
                onChange={(e) => setFilterPositionType(e.target.value)}
                size="small"
              >
                <MenuItem value="">All</MenuItem>
                {Array.from(new Set(positions.map((p) => p.setKey)))
                  .sort()
                  .map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Account Types"
                value={filterAccountTypes}
                onChange={(e) => {
                  const value = e.target.value
                  setFilterAccountTypes(
                    typeof value === 'string' ? value.split(',') : value
                  )
                }}
                size="small"
                slotProps={{
                  select: {
                    multiple: true,
                  },
                }}
              >
                {Array.from(new Set(positions.map((p) => p.accountType)))
                  .sort()
                  .map((type) => (
                    <MenuItem key={type} value={type}>
                      {formatAccountType(type)}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Control #"
                value={filterControlNumber}
                onChange={(e) => setFilterControlNumber(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Vote Status"
                value={filterVoteStatus}
                onChange={(e) => setFilterVoteStatus(e.target.value)}
                size="small"
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Voted">Voted</MenuItem>
                <MenuItem value="Unvoted">Unvoted</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Account #"
                value={filterAccountNumber}
                onChange={(e) => setFilterAccountNumber(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Share Low"
                type="number"
                value={filterShareLow}
                onChange={(e) => setFilterShareLow(e.target.value)}
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Share High"
                type="number"
                value={filterShareHigh}
                onChange={(e) => setFilterShareHigh(e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button variant="contained" onClick={handleApplyFilters}>
            Filter
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
