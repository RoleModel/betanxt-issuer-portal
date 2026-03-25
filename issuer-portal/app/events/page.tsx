'use client'

import { useSession } from 'next-auth/react'
import NextLink from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'

import { ArrowDropDownOutlined, SearchOutlined } from '@mui/icons-material'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'

import buildApiClient from '@/domain-models/apiClient'

import { useEvents } from '@/hooks/useEvents'
import type { EventRow } from '@/utils/eventData'
import { getMeetingUrl } from '@/utils/eventData'

type Order = 'asc' | 'desc'
type OrderBy = keyof EventRow

const mailingStatuses = [
  'Pending Positions',
  'Positions Received',
  'Positions Loaded',
  'Proof Delivered',
  'Proof Approved',
  'Materials Printed',
  'Mailing In Progress',
  'Affidavit Delivered',
  'Mailing Complete',
  'Mailing Canceled',
] as const

type MailingStatus = (typeof mailingStatuses)[number]

const quorumOptions = [
  { label: '50%', value: 50 },
  { label: '33.3%', value: 33.3 },
  { label: '66.6%', value: 66.6 },
  { label: '80%+', value: 80 },
] as const

type QuorumOptionValue = (typeof quorumOptions)[number]['value']

function getQuorumLabel(quorumValue: number | null): string {
  if (typeof quorumValue !== 'number' || !Number.isFinite(quorumValue)) {
    return '50%'
  }

  const matchingOption = quorumOptions.find(
    (option) => Math.abs(option.value - quorumValue) < 0.01
  )

  return matchingOption?.label ?? `${quorumValue}%`
}

function MailingStatusDropdown({
  eventId,
  meetingId,
  status,
  onStatusChange,
}: {
  eventId: string
  meetingId: string
  status: MailingStatus | null
  onStatusChange: (eventId: string, meetingId: string, status: MailingStatus) => void
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (selectedStatus: MailingStatus) => {
    onStatusChange(eventId, meetingId, selectedStatus)
    handleClose()
  }

  return (
    <>
      <Button
        variant="text"
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
      >
        {status ?? 'Set Status'}
        <ArrowDropDownOutlined />
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {mailingStatuses.map((s) => (
          <MenuItem key={s} onClick={() => handleSelect(s)} selected={s === status}>
            {s}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

function QuorumDropdown({
  eventId,
  meetingId,
  quorumValue,
  onQuorumChange,
}: {
  eventId: string
  meetingId: string
  quorumValue: number | null
  onQuorumChange: (
    eventId: string,
    meetingId: string,
    nextQuorumValue: QuorumOptionValue
  ) => void
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (nextQuorumValue: QuorumOptionValue) => {
    onQuorumChange(eventId, meetingId, nextQuorumValue)
    handleClose()
  }

  return (
    <>
      <Button
        variant="text"
        onClick={handleClick}
        sx={{
          textTransform: 'none',
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
      >
        {getQuorumLabel(quorumValue)}
        <ArrowDropDownOutlined />
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {quorumOptions.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => handleSelect(option.value)}
            selected={Math.abs(option.value - (quorumValue ?? 50)) < 0.01}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

function parseEventDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split('/')
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

function formatDate(dateStr: string): string {
  const date = parseEventDate(dateStr)
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export default function EventsPage() {
  const { data: session } = useSession()
  const { events, loading, revalidate } = useEvents()
  const [order, setOrder] = useState<Order>('desc')
  const [orderBy, setOrderBy] = useState<OrderBy>('eventDate')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [mailingStatusOverrides, setMailingStatusOverrides] = useState<
    Record<string, MailingStatus>
  >({})
  const [quorumOverrides, setQuorumOverrides] = useState<Record<string, QuorumOptionValue>>({})

  const userType = session?.user?.type ?? 'PARENT_CLIENT'
  const isCSM = userType === 'CSM'

  const handleMailingStatusChange = useCallback(
    async (eventId: string, meetingId: string, newStatus: MailingStatus) => {
      setMailingStatusOverrides((prev) => ({ ...prev, [eventId]: newStatus }))
      try {
        const api = await buildApiClient()
        await api.PUT('/meetings/{meetingId}', {
          params: { path: { meetingId } },
          body: { mailingStatus: newStatus },
        })
        // Revalidate the SWR cache so the persisted value is in sync
        void revalidate()
      } catch {
        // Revert optimistic update on failure and then revalidate to avoid stale data
        setMailingStatusOverrides((prev) => {
          const next = { ...prev }
          delete next[eventId]
          return next
        })
        void revalidate()
      }
    },
    [revalidate]
  )

  const handleQuorumChange = useCallback(
    async (eventId: string, meetingId: string, nextQuorumValue: QuorumOptionValue) => {
      setQuorumOverrides((prev) => ({ ...prev, [eventId]: nextQuorumValue }))

      try {
        const api = await buildApiClient()
        await api.PUT('/meetings/{meetingId}', {
          params: { path: { meetingId } },
          body: { quorumRequirement: nextQuorumValue },
        })
        void revalidate()
      } catch {
        setQuorumOverrides((prev) => {
          const next = { ...prev }
          delete next[eventId]
          return next
        })
        void revalidate()
      }
    },
    [revalidate]
  )

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (row) =>
          row.event.toLowerCase().includes(query) ||
          row.cusip.toLowerCase().includes(query) ||
          row.eventType.toLowerCase().includes(query) ||
          row.eventDate.includes(query)
      )
    }

    return [...filtered].sort((a, b) => {
      let compareA: string | number | null = a[orderBy]
      let compareB: string | number | null = b[orderBy]

      if (orderBy === 'eventDate') {
        compareA = parseEventDate(a.eventDate).getTime()
        compareB = parseEventDate(b.eventDate).getTime()
      }

      if (typeof compareA === 'number' && typeof compareB === 'number') {
        return order === 'asc' ? compareA - compareB : compareB - compareA
      }

      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return order === 'asc'
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA)
      }

      return 0
    })
  }, [events, searchQuery, order, orderBy])

  const paginatedEvents = useMemo(
    () =>
      filteredAndSortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredAndSortedEvents, page, rowsPerPage]
  )

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const totalPages = Math.ceil(filteredAndSortedEvents.length / rowsPerPage)

  return (
    <Container maxWidth="lg" data-testid="events-page" sx={{ p: { xs: 2, sm: 3 } }}>
      <Card>
        <CardHeader
          title="Events"
          action={
            <TextField
              size="small"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 200 }}
            />
          }
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size={isCSM ? 'small' : undefined}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'event'}
                      direction={orderBy === 'event' ? order : 'asc'}
                      onClick={() => handleRequestSort('event')}
                    >
                      Event
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'cusip'}
                      direction={orderBy === 'cusip' ? order : 'asc'}
                      onClick={() => handleRequestSort('cusip')}
                    >
                      CUSIP
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'eventDate'}
                      direction={orderBy === 'eventDate' ? order : 'asc'}
                      onClick={() => handleRequestSort('eventDate')}
                    >
                      Event Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'eventType'}
                      direction={orderBy === 'eventType' ? order : 'asc'}
                      onClick={() => handleRequestSort('eventType')}
                    >
                      Event Type
                    </TableSortLabel>
                  </TableCell>
                  {isCSM && <TableCell>Mailing Status</TableCell>}
                  {isCSM && <TableCell>Quorum %</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isCSM ? 6 : 4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {paginatedEvents.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Link
                            component={NextLink}
                            href={getMeetingUrl(row)}
                            underline="hover"
                            color="primary"
                            sx={{
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: 'block',
                            }}
                          >
                            {row.event}
                          </Link>
                        </TableCell>
                        <TableCell>{row.cusip}</TableCell>
                        <TableCell>{formatDate(row.eventDate)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {row.eventType}
                        </TableCell>
                        {isCSM && (
                          <TableCell>
                            <MailingStatusDropdown
                              eventId={row.id}
                              meetingId={row.meetingId}
                              status={
                                (mailingStatusOverrides[row.id] ??
                                  row.mailingStatus) as MailingStatus | null
                              }
                              onStatusChange={handleMailingStatusChange}
                            />
                          </TableCell>
                        )}
                        {isCSM && (
                          <TableCell>
                            <QuorumDropdown
                              eventId={row.id}
                              meetingId={row.meetingId}
                              quorumValue={quorumOverrides[row.id] ?? row.quorumRequirement ?? 50}
                              onQuorumChange={handleQuorumChange}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {paginatedEvents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isCSM ? 6 : 4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {searchQuery
                              ? 'No events match your search.'
                              : 'No events found.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    count={filteredAndSortedEvents.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelDisplayedRows={({ from, to }) =>
                      `${from}-${to} of ${totalPages}`
                    }
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  )
}
