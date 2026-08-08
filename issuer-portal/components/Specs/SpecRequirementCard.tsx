"use client";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type {
  Requirement,
  ScreenLinkMap,
} from "@/components/Specs/spec-package";

import { buildJiraTicket } from "@/app/specs/ui-enhancements/to-jira";
import {
  SpecScreenButtons,
  SpecSourceChip,
} from "@/components/Specs/SpecScreenLinks";

/**
 * Copies one requirement as a ready-to-paste Jira ticket.
 *
 * @remarks
 * Estimating from a spec means moving each requirement into a ticket. Copying
 * the whole thing — statement, reasoning, acceptance criteria, and a link back —
 * removes the retyping and stops the ticket drifting from the requirement it
 * came from.
 */
const CopyRequirementButton = ({
  requirement,
  sectionTitle,
}: {
  readonly requirement: Requirement;
  readonly sectionTitle: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
    // Built at click time so the link carries whatever host the reader is on,
    // rather than one baked in when the page was built.
    const specUrl = `${globalThis.location.origin}${globalThis.location.pathname}#${requirement.id}`;

    void navigator.clipboard
      .writeText(buildJiraTicket(requirement, sectionTitle, specUrl))
      .then(() => {
        setCopied(true);
        globalThis.setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
  };

  return (
    <Tooltip title={copied ? "Copied" : "Copy as a Jira ticket"}>
      <IconButton
        aria-label={`Copy ${requirement.id} as a Jira ticket`}
        onClick={handleCopy}
        size="small"
      >
        {copied ? (
          <CheckIcon fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
};

/** One requirement, as a card. */
export const SpecRequirementCard = ({
  requirement,
  screenLinks,
  sectionTitle,
}: {
  readonly requirement: Requirement;
  readonly screenLinks: ScreenLinkMap;
  readonly sectionTitle: string;
}) => (
  <Card id={requirement.id} variant="outlined" sx={{ scrollMarginTop: 24 }}>
    <CardContent>
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={1}
        sx={{ flexWrap: "wrap", mb: 1 }}
      >
        <Typography
          component="span"
          variant="body2"
          sx={{ fontFamily: "monospace", fontWeight: 700 }}
        >
          {requirement.id}
        </Typography>
        <Typography component="h4" variant="subtitle1" sx={{ fontWeight: 600 }}>
          {requirement.title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <CopyRequirementButton
          requirement={requirement}
          sectionTitle={sectionTitle}
        />
      </Stack>

      <Typography variant="body1" sx={{ maxWidth: "72ch" }}>
        {requirement.statement}
      </Typography>

      {requirement.rationale !== undefined && (
        <Box
          sx={{
            borderColor: "divider",
            borderLeft: "3px solid",
            mt: 1.5,
            pl: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: "70ch" }}
          >
            {requirement.rationale}
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle2" sx={{ mb: 0.5, mt: 2 }}>
        Acceptance criteria
      </Typography>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 3 }}>
        {requirement.acceptance.map((criterion) => (
          <Typography
            component="li"
            key={criterion}
            variant="body2"
            sx={{ maxWidth: "72ch" }}
          >
            {criterion}
          </Typography>
        ))}
      </Stack>

      <SpecScreenButtons screens={requirement.screens} />

      {requirement.evidence !== undefined && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            In the code:
          </Typography>
          {requirement.evidence.map((path) => (
            <SpecSourceChip
              key={path}
              path={path}
              screens={screenLinks[path]}
            />
          ))}
        </Stack>
      )}
    </CardContent>
  </Card>
);
