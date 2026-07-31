"use client";

import { Tab, Tabs } from "@mui/material";
import { useState } from "react";

import type { TabulationPosition } from "@/hooks/useTabulationInsights";
import type { ProposalVoting } from "@/types/phases";

import VotingTabulationTable from "@/components/Meeting/VotingTabulationTable";
import PositionsTable from "@/components/Tabulation/PositionsTable";

interface ProposalDetailsTabsProps {
  readonly proposals: readonly ProposalVoting[];
  readonly positions: readonly TabulationPosition[];
  readonly loading: boolean;
  readonly meetingTitle?: string;
  readonly clientTicker?: string;
}

const ProposalDetailsTabs = ({
  proposals,
  positions,
  loading,
  meetingTitle,
  clientTicker,
}: ProposalDetailsTabsProps) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <>
      <Tabs
        value={selectedTab}
        onChange={(event, value: number) => {
          event.persist();
          setSelectedTab(value);
        }}
        sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Positions" />
      </Tabs>

      {selectedTab === 0 ? (
        <VotingTabulationTable proposals={proposals} loading={loading} />
      ) : (
        <PositionsTable
          clientTicker={clientTicker}
          loading={loading}
          meetingTitle={meetingTitle}
          positions={positions}
        />
      )}
    </>
  );
};

export default ProposalDetailsTabs;
