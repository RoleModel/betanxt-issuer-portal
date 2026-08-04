import type { TooltipProps } from "@mui/material/Tooltip";

import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";

export const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip describeChild {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.vars.palette.primary.dark,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.vars.palette.primary.dark,
  },
  [`& .${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
    {
      marginTop: 0,
    },
}));
