import { Card, CardContent, CardHeader } from "@mui/material";

import type { TabulationPosition } from "@/hooks/useTabulationInsights";
import type { ProposalVoting } from "@/types/phases";

import ProposalDetailsTabs from "@/components/Tabulation/ProposalDetailsTabs";

interface ProposalDetailsCardProps {
  readonly proposals: readonly ProposalVoting[];
  readonly positions: readonly TabulationPosition[];
  readonly loading?: boolean;
  readonly meetingTitle?: string;
  readonly clientTicker?: string;
}

const ProposalDetailsCard = ({
  proposals,
  positions,
  loading = false,
  meetingTitle,
  clientTicker,
}: ProposalDetailsCardProps) => {
  return (
    <Card>
      <CardHeader title="Tabulation" />
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <ProposalDetailsTabs
          clientTicker={clientTicker}
          loading={loading}
          meetingTitle={meetingTitle}
          positions={positions}
          proposals={proposals}
        />
      </CardContent>
    </Card>
  );
};

export default ProposalDetailsCard;
