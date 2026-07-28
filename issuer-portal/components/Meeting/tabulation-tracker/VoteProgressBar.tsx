import { Box, Fade, Typography, useTheme } from "@mui/material";
import { domAnimation, LazyMotion, m } from "motion/react";

import { CustomTooltip } from "@/components/ui/CustomToolTip";

interface VoteProgressBarProps {
  readonly enableUpdatedColors?: boolean;
  readonly unvoted: number;
  readonly voted: number;
}

export const VoteProgressBar = ({
  enableUpdatedColors = false,
  voted,
  unvoted,
}: VoteProgressBarProps) => {
  const theme = useTheme();
  const needsExternalVotedLabel = voted < 15;
  const showUnvotedLabel = voted >= 15 && voted < 90;

  return (
    <LazyMotion features={domAnimation}>
      <Fade in timeout={500}>
        <Box
          sx={{
            alignItems: "end",
            bottom: 0,
            display: "flex",
            left: 0,
            overflow: "visible",
            position: "absolute",
            width: "100%",
          }}
        >
          <Box
            component={m.div}
            initial={{ width: 0 }}
            animate={{ width: `${voted}%` }}
            transition={{ duration: 1.5, type: "tween", ease: "easeInOut" }}
            sx={{
              alignItems: "end",
              background: (muiTheme) =>
                enableUpdatedColors
                  ? muiTheme.vars.palette.secondary.dark
                  : muiTheme.vars.palette.keydate.dark,
              display: "flex",
              height: 20,
              justifyContent: "end",
              minWidth: "8px",
              overflow: "visible",
              position: "relative",
              px: needsExternalVotedLabel ? 0 : 2,
            }}
          >
            <Typography
              noWrap
              variant="body3"
              fontWeight={600}
              align={needsExternalVotedLabel ? "right" : "left"}
              sx={{
                color: enableUpdatedColors
                  ? needsExternalVotedLabel
                    ? theme.vars.palette.primary.contrastText
                    : theme.vars.palette.secondary.contrastText
                  : needsExternalVotedLabel
                    ? theme.vars.palette.keydate.contrastText
                    : theme.vars.palette.common.white,
                left: needsExternalVotedLabel ? "110%" : "unset",
                lineHeight: "20px",
                position: needsExternalVotedLabel ? "absolute" : "relative",
              }}
            >
              {voted}% Voted
            </Typography>
          </Box>
          <CustomTooltip
            title={`${unvoted}% Not Voted`}
            arrow
            placement="top-start"
          >
            <Box
              sx={(muiTheme) => ({
                alignItems: "center",
                background: enableUpdatedColors
                  ? `rgba(${muiTheme.vars.palette.primary.lightChannel} / 0.5)`
                  : `rgba(${muiTheme.vars.palette.keydate.darkChannel} / 0.1)`,
                cursor: "pointer",
                display: "flex",
                flexGrow: 1,
                height: 20,
                px: 1,
                py: 0.25,
              })}
            >
              <Typography
                noWrap
                variant="body3"
                fontWeight={600}
                sx={(muiTheme) => ({
                  color: enableUpdatedColors
                    ? muiTheme.vars.palette.primary.contrastText
                    : muiTheme.vars.palette.keydate.contrastText,
                  display: showUnvotedLabel ? "block" : "none",
                })}
              >
                {unvoted}% Not Voted
              </Typography>
            </Box>
          </CustomTooltip>
        </Box>
      </Fade>
    </LazyMotion>
  );
};
