import type { SxProps, TableCellProps } from "@mui/material";

import { TableCell } from "@mui/material";

import React from "react";
import { CustomTooltip } from "@/components/ui/CustomToolTip";

// A TableCell that prevents text from wrapping
// Usage: <NoWrapTableCell>Some long text</NoWrapTableCell>
// or <NoWrapTableCell sx={{ color: 'red' }}>Some long text</NoWrapTableCell>
const NoWrapTableCell: React.FC<TableCellProps & SxProps> = ({
  children,
  ...props
}) => {
  return (
    <CustomTooltip placement="bottom" title={children} arrow>
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
    </CustomTooltip>
  );
};

export default NoWrapTableCell;
