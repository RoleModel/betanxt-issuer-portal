"use client";

import {
  Card,
  CardActionArea,
  CardContent,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

import type { components } from "@/domain-models/generated-schema";
import type { Client } from "@/hooks/useClients";

type Meeting = components["schemas"]["Meeting"];

interface DocumentHostingCardProps {
  readonly meeting?: Meeting;
  readonly client?: Client;
  readonly className?: string;
}

interface SiteHostingButtonProps {
  readonly label: string;
  readonly url: string;
}

const SiteHostingButton = ({ label, url }: SiteHostingButtonProps) => {
  const isPhoneNumber = url.startsWith("1-800") || url.startsWith("+1");
  const isDisabled = !url;

  const handleClick = () => {
    if (isDisabled) return;
    if (isPhoneNumber) {
      window.open(`tel:${url}`, "_self");
    } else {
      window.open(url, "_blank", "noopener");
    }
  };

  return (
    <Card
      variant="outlined"
      onClick={handleClick}
      sx={{
        backgroundColor: "background.default",
        cursor: isDisabled ? "default" : "pointer",
      }}
    >
      <CardActionArea disabled={isDisabled}>
        <CardContent>
          <Typography variant="h3" fontWeight="medium" gutterBottom>
            {label}
          </Typography>
          <Typography variant="body3" fontWeight="medium" gutterBottom>
            {label === "Document Hosting Site"
              ? "Your important documents are fully enhanced to open quickly and are enabled for optimal mobile device performance."
              : "Shareholders can vote quickly and securely online through your eVote portal."}
          </Typography>
          {!isPhoneNumber && !!url && (
            <Link
              sx={{
                wordBreak: "break-all",
                overflowWrap: "break-word",
                wordWrap: "break-word",
              }}
              variant="body3"
              fontWeight={500}
              href={url}
              target="_blank"
            >
              {url}
            </Link>
          )}
          {!isPhoneNumber && !url && (
            <Typography variant="body3" color="text.secondary" fontWeight={500}>
              Not available
            </Typography>
          )}
          {isPhoneNumber ? (
            <Typography variant="body3" color="text.secondary" fontWeight={500}>
              {url}
            </Typography>
          ) : null}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const DocumentHostingCard = ({
  meeting,
  className,
}: DocumentHostingCardProps) => {
  // Generate dynamic URLs based on client branding and ticker
  const hostingSite = {
    label: "Document Hosting Site",
    url: `https://www.proxydocs.com/${meeting?.ticker}`,
    status: meeting?.status,
    hasUrl: true,
  };

  // Generate proxy push URL based on ticker
  const eVoteSite = {
    label: "eVote Site",
    url: meeting?.ticker ? `https://www.proxypush.com/${meeting?.ticker}` : "",
    status: meeting?.status,
    hasUrl: true,
  };

  // Always show all sites; disable click when URL is missing
  const sites = [hostingSite, eVoteSite];

  return (
    <Card
      className={className}
      sx={{ height: "auto", gridArea: "documentLinks" }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          {sites.map((site) => (
            <SiteHostingButton
              key={site.label}
              label={site.label}
              url={site.url}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DocumentHostingCard;
