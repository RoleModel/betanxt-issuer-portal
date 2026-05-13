'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import buildApiClient from '@/domain-models/apiClient'
import type { components } from '@/domain-models/generated-schema'

type Meeting = components['schemas']['Meeting']
type MeetingStatus = components['schemas']['MeetingStatus']
type UpdateMeetingRequest = components['schemas']['UpdateMeetingRequest']

interface EventForm {
  title: string
  cusip: string
  brokerSearchDate: string
  recordDate: string
  mailingDate: string
  meetingDate: string
  cutoffDate: string
  meetingType: string
  status: MeetingStatus
  quorumRequirement: string
}

const meetingStatuses: MeetingStatus[] = ['ACTIVE', 'COMPLETE', 'ADJOURNED']
const meetingTypes = ['Annual Meeting', 'Special Meeting']

const toDateInputValue = (value: string | null | undefined): string => value ?? ''

const toForm = (meeting: Meeting): EventForm => ({
  title: meeting.title ?? '',
  cusip: meeting.cusip ?? '',
  brokerSearchDate: toDateInputValue(meeting.brokerSearchDate),
  recordDate: toDateInputValue(meeting.recordDate),
  mailingDate: toDateInputValue(meeting.mailingDate),
  meetingDate: toDateInputValue(meeting.meetingDate),
  cutoffDate: toDateInputValue(meeting.cutoffDate),
  meetingType: meeting.meetingType ?? 'Annual Meeting',
  status: meeting.status ?? 'ACTIVE',
  quorumRequirement:
    typeof meeting.quorumRequirement === 'number'
      ? String(meeting.quorumRequirement)
      : '',
})

const optionalDate = (value: string): string | undefined =>
  value.trim() ? value.trim() : undefined

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error
    if (typeof message === 'string') return message
  }

  return fallback
}

const isMeetingResponse = (value: unknown): value is Meeting => {
  if (!value || typeof value !== 'object') return false
  if (!('id' in value)) return false

  return typeof value.id === 'string'
}

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { mutate } = useSWRConfig()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [form, setForm] = useState<EventForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const authBypassed = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const canEdit = session?.user?.type === 'CSM' || authBypassed

  useEffect(() => {
    if (!authBypassed && sessionStatus === 'loading') return

    if (!canEdit) {
      setLoading(false)
      return
    }

    const loadMeeting = async () => {
      setLoading(true)
      setError(null)

      try {
        const api = await buildApiClient()
        const { data, error: fetchError } = await api.GET('/meetings/{meetingId}', {
          params: { path: { meetingId: eventId } },
        })

        const rawMeeting: unknown = data
        if (fetchError || !isMeetingResponse(rawMeeting)) {
          throw new Error(getApiErrorMessage(fetchError, 'Event not found'))
        }

        setMeeting(rawMeeting)
        setForm(toForm(rawMeeting))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load event')
      } finally {
        setLoading(false)
      }
    }

    void loadMeeting()
  }, [authBypassed, canEdit, eventId, sessionStatus])

  const pageTitle = useMemo(() => {
    if (!meeting) return 'Edit Event'
    return `Edit ${meeting.ticker ?? 'Event'} ${meeting.title ?? 'Event'}`
  }, [meeting])

  const handleTextChange =
    (field: keyof EventForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setForm((current) => (current ? { ...current, [field]: value } : current))
      setSuccess(false)
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return

    const quorumRequirement = Number(form.quorumRequirement)
    if (!Number.isFinite(quorumRequirement) || quorumRequirement <= 0) {
      setError('Quorum requirement must be a positive percentage.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const updateBody: UpdateMeetingRequest = {
      title: form.title.trim(),
      cusip: form.cusip.trim(),
      brokerSearchDate: optionalDate(form.brokerSearchDate),
      recordDate: form.recordDate,
      mailingDate: form.mailingDate,
      meetingDate: form.meetingDate,
      cutoffDate: optionalDate(form.cutoffDate),
      meetingType: form.meetingType,
      status: form.status,
      quorumRequirement,
    }

    try {
      const api = await buildApiClient()
      const { data, error: updateError } = await api.PUT('/meetings/{meetingId}', {
        params: { path: { meetingId: eventId } },
        body: updateBody,
      })

      const rawMeeting: unknown = data
      if (updateError || !isMeetingResponse(rawMeeting)) {
        throw new Error(getApiErrorMessage(updateError, 'Event update failed'))
      }

      if (
        rawMeeting.id !== eventId ||
        rawMeeting.title !== updateBody.title ||
        rawMeeting.meetingType !== updateBody.meetingType
      ) {
        throw new Error('Event update did not persist. Check the configured API server.')
      }

      setMeeting(rawMeeting)
      setForm(toForm(rawMeeting))
      await mutate((key) => Array.isArray(key) && key[0] === '/events-list', undefined, {
        revalidate: true,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Button variant="text" onClick={() => router.push('/events')} sx={{ mb: 2 }}>
        Back to Events
      </Button>

      <Card>
        <CardHeader
          title={pageTitle}
          subheader={
            meeting?.ticker && meeting?.cusip
              ? `${meeting.ticker} - CUSIP ${meeting.cusip}`
              : undefined
          }
        />
        <CardContent>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={240}
            >
              <CircularProgress />
            </Box>
          ) : !canEdit ? (
            <Alert severity="warning">Only CSM users can edit events.</Alert>
          ) : error && !form ? (
            <Alert severity="error">{error}</Alert>
          ) : form ? (
            <Box component="form" id="edit-event-form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">Event updated.</Alert>}

                <TextField
                  label="Meeting Title"
                  value={form.title}
                  onChange={handleTextChange('title')}
                  fullWidth
                  required
                  inputProps={{ maxLength: 200 }}
                />

                <TextField
                  label="CUSIP"
                  value={form.cusip}
                  onChange={handleTextChange('cusip')}
                  fullWidth
                  required
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    select
                    label="Event Type"
                    value={form.meetingType}
                    onChange={handleTextChange('meetingType')}
                    fullWidth
                    required
                  >
                    {meetingTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Status"
                    value={form.status}
                    onChange={handleTextChange('status')}
                    fullWidth
                    required
                  >
                    {meetingStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Broker Search Date"
                    type="date"
                    value={form.brokerSearchDate}
                    onChange={handleTextChange('brokerSearchDate')}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Record Date"
                    type="date"
                    value={form.recordDate}
                    onChange={handleTextChange('recordDate')}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Mailing Date"
                    type="date"
                    value={form.mailingDate}
                    onChange={handleTextChange('mailingDate')}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Event Date"
                    type="date"
                    value={form.meetingDate}
                    onChange={handleTextChange('meetingDate')}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Cutoff Date"
                    type="date"
                    value={form.cutoffDate}
                    onChange={handleTextChange('cutoffDate')}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Quorum Requirement (%)"
                    type="number"
                    value={form.quorumRequirement}
                    onChange={handleTextChange('quorumRequirement')}
                    fullWidth
                    required
                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                  />
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Typography color="text.secondary">Event not found.</Typography>
          )}
        </CardContent>
        {form && canEdit && (
          <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
            <Button
              type="submit"
              form="edit-event-form"
              variant="contained"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardActions>
        )}
      </Card>
    </Container>
  )
}
