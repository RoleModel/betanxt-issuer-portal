import React from 'react'

import { Box, Button, Typography, styled } from '@mui/material'

import { getPhaseColor } from '@/components/mui-styling/theme'
import StatusChip from '@/components/ui/StatusChip'

import type { Task } from '@/types/api'

;('use client')

interface TaskItemProps {
  task: Task
  onClick?: (task: Task) => void
}

const StyledTaskButton = styled(Button)<{ phasecolor: string }>(
  ({ theme, phasecolor }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    gap: theme.spacing(1),
    width: '100%',
    minHeight: 'unset',
    height: 'auto',
    color: theme.vars.palette.text.primary,
    backgroundColor: theme.vars.palette.tableCellRow.fill,
    boxShadow: `0px 0px 0px 1px inset ${theme.vars?.palette.divider}`,
    borderLeft: `5px solid ${phasecolor}`,
    borderRadius: theme.spacing(0.5),
    cursor: 'pointer',
    transition: theme.transitions.create(['box-shadow']),
    '&:hover': {
      boxShadow: `0px 0px 0px 1px inset ${phasecolor}`,
    },
  })
)

const TaskItem: React.FC<TaskItemProps> = ({ task, onClick }) => {
  const transformStatus = (status: string | null | undefined): string => {
    if (!status) return 'Incomplete'
    return String(status)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const statusLabel = transformStatus(task.status)

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Use phase color based on phaseNumber (convert to 0-based index)
  const phaseColor = getPhaseColor((task.phaseNumber || 1) - 1)

  return (
    <StyledTaskButton
      phasecolor={phaseColor}
      onClick={() => onClick?.(task)}
      role="button"
      tabIndex={0}
      data-testid={`task-card-${task.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(task)
        }
      }}
      aria-label={`Task: ${task.title}, assigned to ${task.owner}, due ${formatDate(task.dueDate)}, status ${statusLabel}`}
    >
      {/* Start Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Typography
          variant="body3"
          fontWeight={500}
          data-testid="task-title"
          sx={{
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          {task.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
          }}
        >
          {task.owner}
        </Typography>
      </Box>

      {/* End Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="body3"
          fontWeight={500}
          sx={{
            whiteSpace: 'nowrap',
            marginBottom: (theme) => theme.spacing(0.5),
          }}
        >
          {formatDate(task.dueDate)}
        </Typography>
        <StatusChip status={statusLabel} size="small" />
      </Box>
    </StyledTaskButton>
  )
}

export default TaskItem
