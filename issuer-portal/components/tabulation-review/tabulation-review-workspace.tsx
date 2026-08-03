"use client";

import type { TransitionProps } from "@mui/material/transitions";

import { Close as CloseIcon, Menu as MenuIcon } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Chip,
  Dialog,
  Drawer,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import React from "react";

import { EmptyState } from "@/components/EmptyState";
import { useTabulationReviewWorkspace } from "@/hooks/use-tabulation-review-workspace";

import { ReviewQueueTree } from "./review-queue-tree";
import { ReviewWorkArea } from "./review-work-area";
import { TabulationReportEmailPreview } from "./tabulation-report-email-preview";

const Transition = React.forwardRef(
  (
    props: TransitionProps & {
      readonly children: React.ReactElement<unknown>;
    },
    ref: React.Ref<unknown>,
  ) => <Slide direction="up" ref={ref} {...props} />,
);
Transition.displayName = "TabulationReviewWorkspaceTransition";

export interface TabulationReviewWorkspaceProps {
  /** Preselects a meeting when the workspace opens from a deep link. */
  readonly initialMeetingId?: string | null;
  readonly onClose: () => void;
  readonly open: boolean;
}

/**
 * Full-screen CSM workflow shell for reviewing tabulation reports. State and
 * persistence live in hooks; this component handles the responsive layout.
 */
export const TabulationReviewWorkspace = ({
  initialMeetingId = null,
  onClose,
  open,
}: TabulationReviewWorkspaceProps) => {
  const workspace = useTabulationReviewWorkspace({ initialMeetingId, onClose });
  const { review } = workspace;

  return (
    <Dialog
      fullScreen
      onClose={workspace.handleClose}
      open={open}
      slots={{ transition: Transition }}
    >
      <AppBar
        color="primary"
        elevation={10}
        position="static"
        sx={(theme) => ({
          "&&": {
            backgroundColor: `var(--mui-palette-appBar-background)`,
          },
          boxShadow: theme.shadows[10],
          color: `var(--mui-palette-text-primary)`,
        })}
      >
        <Toolbar sx={{ color: `var(--mui-palette-text-primary)`, px: { xs: 1, sm: 3 } }}>
          <Box sx={{ alignItems: "center", display: "flex", flexGrow: 1, gap: 1.5, minWidth: 0 }}>
            <IconButton
              aria-label="close"
              color="inherit"
              edge="start"
              onClick={workspace.handleClose}
            >
              <CloseIcon />
            </IconButton>
            {workspace.gateOpen && workspace.isQueueDrawer ? (
              <IconButton
                aria-label="Open report queue"
                color="inherit"
                onClick={workspace.handleOpenQueue}
              >
                <MenuIcon />
              </IconButton>
            ) : null}
            <Typography noWrap sx={{ minWidth: 0 }} variant="h4">
              {workspace.titleLabel}
            </Typography>
            <Chip
              color={workspace.progressColor}
              label={workspace.progressLabel}
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          background: "var(--mui-palette-background-default)",
          display: "flex",
          height: "calc(100dvh - 64px)",
        }}
      >
        {workspace.gateOpen ? (
          <>
            {workspace.isQueueDrawer ? (
              <Drawer
                anchor="left"
                onClose={workspace.handleCloseQueue}
                open={workspace.queueOpen}
                slotProps={{
                  paper: {
                    sx: {
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      maxWidth: "100%",
                      width: { xs: "min(88vw, 380px)", sm: 420 },
                    },
                  },
                }}
                sx={(theme) => ({ zIndex: theme.zIndex.modal + 1 })}
              >
                <ReviewQueueTree
                  loading={workspace.loading}
                  mode="drawer"
                  onSelect={workspace.handleSelectReport}
                  pendingItems={workspace.pendingItems}
                  progress={workspace.progress}
                  selectedId={workspace.effectiveSelectedId}
                  verifiedItems={workspace.verifiedItems}
                />
              </Drawer>
            ) : (
              <ReviewQueueTree
                loading={workspace.loading}
                onSelect={workspace.handleSelectReport}
                pendingItems={workspace.pendingItems}
                progress={workspace.progress}
                selectedId={workspace.effectiveSelectedId}
                verifiedItems={workspace.verifiedItems}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0, overflow: "auto", p: { xs: 1.5, sm: 2, md: 3 } }}>
              {workspace.selected === null ? (
                <EmptyState
                  description="Choose a report from the list to start your review."
                  title="Select a report"
                />
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) minmax(360px, 430px)" },
                  }}
                >
                  <ReviewWorkArea
                    allChecked={review.allChecked}
                    checklist={review.checklist}
                    confirmOpen={review.confirmOpen}
                    dirtyCount={review.dirtyCount}
                    isFinalReport={review.isFinalReport}
                    item={workspace.selected}
                    onCancelConfirm={review.onCancelConfirm}
                    onConfirmVerify={review.onConfirmVerify}
                    onReopen={review.onReopen}
                    onRequestVerify={review.onRequestVerify}
                    onRowUpdate={review.onRowUpdate}
                    onSaveAdjustments={review.onSaveAdjustments}
                    onToggleChecklist={review.onToggleChecklist}
                    originalRows={review.originalRows}
                    proposalsLoading={review.proposalsLoading}
                    rows={review.rows}
                    saveOutcome={review.saveOutcome}
                    saving={review.saving}
                  />
                  <TabulationReportEmailPreview preview={workspace.emailPreview} />
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, p: 3 }}>
            <EmptyState description={workspace.gateDescription} title={workspace.gateTitle} />
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

export default TabulationReviewWorkspace;
