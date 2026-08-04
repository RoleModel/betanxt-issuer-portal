"use client";

import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import React from "react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface TaskContextMenuProps {
  readonly open: boolean;
  readonly position: ContextMenuPosition | null;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete?: () => void;
  readonly showEdit?: boolean;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  open,
  position,
  onClose,
  onEdit,
  onDelete,
  showEdit = true,
}) => {
  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position ? { top: position.y, left: position.x } : undefined
      }
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
      {showEdit ? (
        <MenuItem
          onClick={() => {
            handleItemClick(onEdit);
          }}
        >
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
      ) : null}

      {onDelete
        ? [
            <Divider key="divider-delete" />,
            <MenuItem
              key="delete"
              onClick={() => {
                handleItemClick(onDelete);
              }}
              sx={{ color: "error.main" }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
              </ListItemIcon>
              <ListItemText>Delete Task</ListItemText>
            </MenuItem>,
          ]
        : null}
    </Menu>
  );
};

export default TaskContextMenu;
