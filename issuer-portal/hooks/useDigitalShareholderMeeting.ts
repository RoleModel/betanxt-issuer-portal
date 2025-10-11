import useSWR from 'swr'

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

interface UploadAttendeeData {
  registrantType: string
  firstName: string
  lastName: string
  emailAddress: string
  registrationQuestions?: string
  minutesAttendedMeeting?: number
}

export interface UseDigitalShareholderMeetingReturn {
  attendees: DigitalShareholderMeetingAttendee[]
  error: Error | undefined
  isLoading: boolean
  uploadAttendees: (attendees: UploadAttendeeData[]) => Promise<unknown>
  mutate: () => Promise<DigitalShareholderMeetingAttendee[] | undefined>
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'

export function useDigitalShareholderMeeting(meetingId: string | undefined): UseDigitalShareholderMeetingReturn {
  const fetcher = async (url: string): Promise<DigitalShareholderMeetingAttendee[]> => {
    const response = await fetch(`${API_URL}${url}`)
    if (!response.ok) {
      throw new Error('Failed to fetch attendees')
    }
    return response.json() as Promise<DigitalShareholderMeetingAttendee[]>
  }

  const swrResult = useSWR<DigitalShareholderMeetingAttendee[]>(
    meetingId ? `/meetings/${meetingId}/digital-shareholder-meeting` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )
  const data = swrResult.data
  const error = swrResult.error as Error | undefined
  const isLoading = swrResult.isLoading
  const mutate = swrResult.mutate

  const uploadAttendees = async (attendees: UploadAttendeeData[]) => {
    if (!meetingId) {
      throw new Error('Meeting ID is required')
    }

    const response = await fetch(
      `${API_URL}/meetings/${meetingId}/digital-shareholder-meeting`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendees),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload attendees')
    }

    const result = await response.json() as unknown
    await mutate()
    return result
  }

  return {
    attendees: data || [],
    error,
    isLoading,
    uploadAttendees,
    mutate,
  }
}
