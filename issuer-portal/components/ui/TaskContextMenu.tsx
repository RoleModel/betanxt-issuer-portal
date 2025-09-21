'use client'

import React from 'react'

import { Delete as DeleteIcon } from '@mui/icons-material'
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'

export interface ContextMenuPosition {
  x: number
  y: number
}

interface TaskContextMenuProps {
  open: boolean
  position: ContextMenuPosition | null
  onClose: () => void
  onEdit: () => void
  onView: () => void
  onUploadDocument?: () => void
  onDelete?: () => void
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  open,
  position,
  onClose,
  onEdit,
  onView,
  onUploadDocument,
  onDelete,
}) => {
  const handleItemClick = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ? { top: position.y, left: position.x } : undefined}
      slotProps={{
        paper: {
          sx: {
            minWidth: 160,
            boxShadow: 3,
            borderRadius: 1,
          },
        },
      }}
    >
      <MenuItem onClick={() => handleItemClick(onView)}>
        <ListItemText>View Details</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => handleItemClick(onEdit)}>
        <ListItemText>Edit Task</ListItemText>
      </MenuItem>

      {onUploadDocument && (
        <MenuItem onClick={() => handleItemClick(onUploadDocument)}>
          <ListItemText>Upload Document</ListItemText>
        </MenuItem>
      )}

      {onDelete && [
        <Divider key="divider-delete" />,
        <MenuItem
          key="delete"
          onClick={() => handleItemClick(onDelete)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>,
      ]}
    </Menu>
  )
}

export default TaskContextMenu
