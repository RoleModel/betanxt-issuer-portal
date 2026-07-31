"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";

import { useMeeting } from "@/contexts/MeetingContext";
import { useVotingTabulation } from "@/hooks/use-voting-tabulation";
import { getVotingOptionsDisplay } from "@/utils/votingOptions";

interface AgendaTableProps {
  onUploadClick?: () => void;
}

const AgendaTable = (_props: AgendaTableProps) => {
  const { currentMeeting } = useMeeting();
  const { proposals } = useVotingTabulation(currentMeeting?.id);

  // Use shared utility for vote options
  const getVoteOptions = (
    proposalType?: string,
    proposalNumber?: string,
    directorName?: string
  ) => {
    return getVotingOptionsDisplay(
      proposalType,
      proposalNumber,
      currentMeeting?.ticker,
      directorName
    );
  };

  return (
    <Card>
      <CardHeader
        title="Meeting Agenda"
        sx={{
          backgroundColor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      />
      <CardContent sx={{ p: 0 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "background.default" }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                Proposals
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: "120px" }}
              >
                Management Recommendation
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, fontSize: "0.875rem", width: "300px" }}
              >
                Vote Options
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals && proposals.length > 0 ? (
              <>
                {/* Count director proposals for the header */}
                {(() => {
                  const directorProposals = proposals.filter(
                    (p) =>
                      p.proposalNumber.toString().startsWith("1.") &&
                      p.directorName
                  );
                  const hasDirectorElections = directorProposals.length > 0;

                  return (
                    <>
                      {/* Add header row for director elections if we have them */}
                      {hasDirectorElections && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            sx={{
                              backgroundColor: "action.hover",
                              py: 1.5,
                              fontWeight: 600,
                            }}
                          >
                            <Typography fontWeight={600}>
                              1. Election of the {directorProposals.length}{" "}
                              directors named in the accompanying Proxy
                              Statement
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Render all proposals, filtering out proposal 1 if we have sub-proposals */}
                      {proposals
                        .filter((proposal) => {
                          // If we have director sub-proposals (1.01, 1.02, etc), don't show proposal 1
                          if (
                            hasDirectorElections &&
                            proposal.proposalNumber.toString() === "1"
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((proposal, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              "&:hover": {
                                backgroundColor: "action.hover",
                              },
                            }}
                          >
                            <TableCell>
                              <Box>
                                <Box
                                  display={"flex"}
                                  alignItems="center"
                                  gap={0.5}
                                  sx={{
                                    pl: proposal.proposalNumber
                                      .toString()
                                      .includes(".")
                                      ? 3
                                      : 0,
                                  }}
                                >
                                  <Typography fontWeight={600}>
                                    {proposal.proposalNumber}.
                                  </Typography>
                                  <Typography color="text.primary">
                                    {proposal.directorName ||
                                      proposal.proposalTitle}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography color="text.primary">
                                {proposal.recommendation || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "nowrap",
                                }}
                              >
                                {getVoteOptions(
                                  proposal.proposalType,
                                  proposal.proposalNumber.toString(),
                                  proposal.directorName
                                ).map((option) => (
                                  <Chip
                                    key={option}
                                    label={option}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </>
                  );
                })()}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No proposals available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AgendaTable;
