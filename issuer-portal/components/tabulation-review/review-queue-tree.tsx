"use client";

import {
  CheckCircle as CheckCircleIcon,
  PendingActionsOutlined as PendingActionsOutlinedIcon,
} from "@mui/icons-material";
import { Box, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";

import type { ReviewQueueItem } from "@/hooks/use-tabulation-review-queue";

interface QueueItemLabelProps {
  readonly item: ReviewQueueItem;
}

const QueueItemLabel = ({ item }: QueueItemLabelProps) => (
  <Stack
    alignItems="center"
    direction="row"
    justifyContent="space-between"
    spacing={1}
    sx={{ py: 0.25 }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography component="div" noWrap variant="subtitle2">
        {item.companyName} - <Chip label={item.meetingTitle} size="small" variant="outlined" />
      </Typography>
    </Box>
    {item.verified ? (
      <CheckCircleIcon color="success" fontSize="small" />
    ) : item.checkpoint === "FINAL_REPORT" ? (
      <Chip color="error" label="Final" size="small" variant="outlined" />
    ) : null}
  </Stack>
);

interface StatusGroupLabelProps {
  readonly count: number;
  readonly kind: "pending" | "verified";
}

const StatusGroupLabel = ({ count, kind }: StatusGroupLabelProps) => (
  <Stack alignItems="center" direction="row" spacing={1}>
    {kind === "pending" ? (
      <PendingActionsOutlinedIcon color="info" fontSize="small" />
    ) : (
      <CheckCircleIcon color="success" fontSize="small" />
    )}
    <Typography variant="subtitle2">
      {kind === "pending" ? "Needs review" : "Verified"} ({count})
    </Typography>
  </Stack>
);

interface ReviewQueueTreeProps {
  readonly loading: boolean;
  readonly mode?: "drawer" | "rail";
  readonly onSelect: (meetingId: string) => void;
  readonly pendingItems: ReviewQueueItem[];
  readonly progress: number;
  readonly selectedId: string | null;
  readonly verifiedItems: ReviewQueueItem[];
}

const ConnectorLineWidth = 1;
const ConnectorLineCenter = 17.5;
const ConnectorLineLeft = ConnectorLineCenter - ConnectorLineWidth / 2;

const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.grey[200],
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    margin: theme.spacing(0.2, 0),
    [`& .${treeItemClasses.label}`]: {
      fontSize: "0.8rem",
      fontWeight: 500,
    },
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    borderRadius: "50%",
    backgroundColor: theme.palette.primary.dark,
    padding: theme.spacing(0, 1.2),
    ...theme.applyStyles("light", {
      backgroundColor: alpha(theme.palette.primary.main, 0.25),
    }),
    ...theme.applyStyles("dark", {
      color: theme.palette.primary.contrastText,
    }),
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: ConnectorLineLeft,
    paddingLeft: 16,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  ...theme.applyStyles("light", {
    color: theme.palette.grey[800],
  }),
}));

/**
 * Status-grouped report queue. Desktop renders it as a fixed rail; mobile
 * renders the same tree inside a temporary MUI drawer.
 */
export const ReviewQueueTree = ({
  loading,
  mode = "rail",
  onSelect,
  pendingItems,
  progress,
  selectedId,
  verifiedItems,
}: ReviewQueueTreeProps) => (
  <Box
    sx={{
      borderRight: mode === "rail" ? "1px solid var(--mui-palette-divider)" : 0,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "auto",
      p: 2,
      width: mode === "rail" ? 450 : "100%",
    }}
  >
    <Box sx={{ mb: 2 }}>
      <LinearProgress
        sx={{ borderRadius: 4, height: 8, mb: 1 }}
        value={progress}
        variant="determinate"
      />
      <Typography color="text.secondary" variant="caption">
        Work through each report: confirm broker non-votes, classification, and vote categories.
      </Typography>
    </Box>
    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    ) : (
      <SimpleTreeView
        defaultExpandedItems={["status-pending", "status-verified"]}
        onSelectedItemsChange={(event, itemId) => {
          if (typeof itemId === "string" && !itemId.startsWith("status-")) {
            onSelect(itemId);
          }
        }}
        selectedItems={selectedId}
      >
        <CustomTreeItem
          itemId="status-pending"
          label={<StatusGroupLabel count={pendingItems.length} kind="pending" />}
        >
          {pendingItems.map((item) => (
            <CustomTreeItem
              itemId={item.meetingId}
              key={item.meetingId}
              label={<QueueItemLabel item={item} />}
            />
          ))}
        </CustomTreeItem>
        <CustomTreeItem
          itemId="status-verified"
          label={<StatusGroupLabel count={verifiedItems.length} kind="verified" />}
        >
          {verifiedItems.map((item) => (
            <CustomTreeItem
              itemId={item.meetingId}
              key={item.meetingId}
              label={<QueueItemLabel item={item} />}
            />
          ))}
        </CustomTreeItem>
      </SimpleTreeView>
    )}
  </Box>
);
