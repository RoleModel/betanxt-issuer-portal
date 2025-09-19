// Calendar types for Calendar components

export interface CalendarDate {
  date: Date
  isCurrentMonth: boolean
  tasks: TaskItem[]
  keyDates: PhaseKeyDate[]
}

export interface CalendarWeek {
  days: CalendarDate[]
}

export interface CalendarMonth {
  month: Date
  weeks: CalendarWeek[]
}

export interface TaskItem {
  id: string
  title: string
  description: string | null
  owner: string
  dueDate: string | null
  status: 'INCOMPLETE' | 'COMPLETE' | 'CANCELLED' | 'NEEDS_AUTHORIZATION' | 'AUTHORIZED'
  meetingId: string
  phaseId: string
  phaseNumber: number
  phase_number?: number // For compatibility with existing code
  type: string
  taskId: string
  documentId: string | null
  documents?: Array<{ id: string; url: string }>
  links: Array<{ label: string; url: string; action: string }> | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PhaseKeyDate {
  id: string
  date: string
  title: string
  description?: string
  type: string
  phaseId: string
}

export interface ContextMenuPosition {
  x: number
  y: number
}
