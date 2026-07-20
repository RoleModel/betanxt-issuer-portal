import type { SxProps, TableCellProps } from "@mui/material";

import { TableCell } from "@mui/material";
import { Tooltip } from "@mui/material";
import React from "react";

// A TableCell that prevents text from wrapping
// Usage: <NoWrapTableCell>Some long text</NoWrapTableCell>
// or <NoWrapTableCell sx={{ color: 'red' }}>Some long text</NoWrapTableCell>
const NoWrapTableCell: React.FC<TableCellProps & SxProps> = ({
  children,
  ...props
}) => {
  return (
    <Tooltip placement="bottom" title={children} arrow>
      <TableCell
        {...props}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: { xs: 150, xl: "unset" },
          ...props.sx,
        }}
      >
        {children}
      </TableCell>
    </Tooltip>
  );
};

export default NoWrapTableCell;
