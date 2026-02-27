'use client'

import { useSession } from 'next-auth/react'
import NextLink from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ArrowDropDownOutlined, SearchOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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

import {
  type EventRow,
  allEvents,
  getMeetingUrl,
  parentClientEvents,
  solicitorEvents,
} from '@/utils/eventData'

type Order = 'asc' | 'desc'
type OrderBy = keyof EventRow

const mailingStatuses = [
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

const userTypeConfig: Record<string, { heading: string; events: EventRow[] }> = {
  PARENT_CLIENT: {
    heading: 'Issuer Admin',
    events: parentClientEvents,
  },
  SOLICITOR: {
    heading: 'Solicitor Dashboard',
    events: solicitorEvents,
  },
  CSM: {
    heading: 'CSM Dashboard',
    events: allEvents,
  },
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
  const [order, setOrder] = useState<Order>('desc')
  const [orderBy, setOrderBy] = useState<OrderBy>('eventDate')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [mailingStatusMap, setMailingStatusMap] = useState<Record<string, MailingStatus>>(
    {}
  )

  const userType = session?.user?.type ?? 'PARENT_CLIENT'
  const config = userTypeConfig[userType] ?? userTypeConfig.PARENT_CLIENT
  const isCSM = userType === 'CSM'

  // Load existing mailing statuses from the API so they persist across navigations
  useEffect(() => {
    if (!isCSM) return
    let active = true
    const loadStatuses = async () => {
      try {
        const api = await buildApiClient()
        const uniqueMeetingIds = [...new Set(config.events.map((e) => e.meetingId))]
        const statusEntries: [string, MailingStatus][] = []
        await Promise.all(
          uniqueMeetingIds.map(async (meetingId) => {
            const { data } = await api.GET('/meetings/{meetingId}', {
              params: { path: { meetingId } },
            })
            if (data && typeof data === 'object' && 'mailingStatus' in data) {
              const status = (data as Record<string, unknown>).mailingStatus
              if (typeof status === 'string' && status) {
                // Find all events that map to this meetingId
                const matchingEvents = config.events.filter(
                  (e) => e.meetingId === meetingId
                )
                for (const ev of matchingEvents) {
                  statusEntries.push([ev.id, status as MailingStatus])
                }
              }
            }
          })
        )
        if (active && statusEntries.length > 0) {
          setMailingStatusMap(Object.fromEntries(statusEntries))
        }
      } catch {
        // Silently fail — statuses will show as "Set Status"
      }
    }
    void loadStatuses()
    return () => {
      active = false
    }
  }, [isCSM, config.events])

  const handleMailingStatusChange = useCallback(
    async (eventId: string, meetingId: string, newStatus: MailingStatus) => {
      setMailingStatusMap((prev) => ({ ...prev, [eventId]: newStatus }))
      try {
        const api = await buildApiClient()
        await api.PUT('/meetings/{meetingId}', {
          params: { path: { meetingId } },
          body: { mailingStatus: newStatus },
        })
      } catch {
        // Optimistic update — status is already set in local state
      }
    },
    []
  )

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = config.events

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
      let compareA: string | number = a[orderBy]
      let compareB: string | number = b[orderBy]

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
  }, [config.events, searchQuery, order, orderBy])

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
    <Container component="main" maxWidth="lg" data-testid="events-page">
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="pageTitle" sx={{ mb: 3 }}>
          {config.heading}
        </Typography>

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
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      <TableSortLabel
                        active={orderBy === 'event'}
                        direction={orderBy === 'event' ? order : 'asc'}
                        onClick={() => handleRequestSort('event')}
                      >
                        Event
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      <TableSortLabel
                        active={orderBy === 'cusip'}
                        direction={orderBy === 'cusip' ? order : 'asc'}
                        onClick={() => handleRequestSort('cusip')}
                      >
                        CUSIP
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      <TableSortLabel
                        active={orderBy === 'eventDate'}
                        direction={orderBy === 'eventDate' ? order : 'asc'}
                        onClick={() => handleRequestSort('eventDate')}
                      >
                        Event Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 2 }}>
                      <TableSortLabel
                        active={orderBy === 'eventType'}
                        direction={orderBy === 'eventType' ? order : 'asc'}
                        onClick={() => handleRequestSort('eventType')}
                      >
                        Event Type
                      </TableSortLabel>
                    </TableCell>
                    {isCSM && (
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>
                        Mailing Status
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvents.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Link
                          component={NextLink}
                          href={getMeetingUrl(row)}
                          underline="hover"
                          color="primary"
                          sx={{ fontWeight: 500 }}
                        >
                          {row.event}
                        </Link>
                      </TableCell>
                      <TableCell>{row.cusip}</TableCell>
                      <TableCell>{formatDate(row.eventDate)}</TableCell>
                      <TableCell>{row.eventType}</TableCell>
                      {isCSM && (
                        <TableCell>
                          <MailingStatusDropdown
                            eventId={row.id}
                            meetingId={row.meetingId}
                            status={mailingStatusMap[row.id] ?? null}
                            onStatusChange={handleMailingStatusChange}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {paginatedEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isCSM ? 5 : 4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {searchQuery
                            ? 'No events match your search.'
                            : 'No events found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
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
      </Box>
    </Container>
  )
}
