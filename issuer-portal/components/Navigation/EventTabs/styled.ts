"use client";

import { IconButton, ToggleButton, styled } from "@mui/material";

export const ScrollButton = styled(IconButton, {
  shouldForwardProp: (property) => property !== "direction",
})<{ direction: "left" | "right" }>(({ theme, direction }) => ({
  "& .MuiSvgIcon-root": {
    color: theme.vars.palette.common.white,
    fontSize: "16px",
    transform: `rotate(${direction === "left" ? "90deg" : "-90deg"})`,
  },
  "&:hover": {
    backgroundColor: theme.vars.palette.primary.dark,
  },
  backgroundColor: theme.vars.palette.primary.main,
  border: "1px solid",
  borderColor: theme.vars.palette.divider,
  borderRadius: 0,
  borderWidth: direction === "left" ? "0 1px 0 0" : "0 0 0 1px",
  bottom: 0,
  [direction]: 0,
  height: "100%",
  position: "absolute",
  top: 0,
  width: theme.spacing(2.5),
  zIndex: 1,
}));

export const DisplayToggleButton = styled(ToggleButton)(({ theme }) => ({
  "&&": {
    backgroundColor: "transparent",
    blockSize: 32,
    borderColor: theme.vars.palette.divider,
    color: theme.vars.palette.text.primary,
  },
  "&&:hover": {
    backgroundColor: theme.vars.palette.action.hover,
  },
  // `&&:hover` and `&&.Mui-selected` have identical specificity (0,3,0), so the
  // source order here decides which one wins for a selected + hovered button.
  // Alphabetising would flip that, hence the targeted disable.

  "&&.Mui-selected": {
    "&:hover": {
      backgroundColor: theme.vars.palette.action.hover,
    },
    backgroundColor: theme.vars.palette.background.paper,
    borderColor: theme.vars.palette.primary.main,
    color: theme.vars.palette.text.primary,
  },
}));
