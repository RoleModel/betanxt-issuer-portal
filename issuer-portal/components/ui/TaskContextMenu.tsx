"use client";

import { Delete as DeleteIcon } from "@mui/icons-material";
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import React from "react";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface TaskContextMenuProps {
  open: boolean;
  position: ContextMenuPosition | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
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
      {showEdit && (
        <MenuItem onClick={() => handleItemClick(onEdit)}>
          <ListItemText>Edit Task</ListItemText>
        </MenuItem>
      )}

      {onDelete && [
        <Divider key="divider-delete" />,
        <MenuItem
          key="delete"
          onClick={() => handleItemClick(onDelete)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>,
      ]}
    </Menu>
  );
};

export default TaskContextMenu;
