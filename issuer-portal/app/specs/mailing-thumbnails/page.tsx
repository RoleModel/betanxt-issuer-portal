"use client";

import type { CodeSample } from "@/app/specs/ui-enhancements/code-samples";
import type {
  Requirement,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/mailing-thumbnails/affected-files";
import { CODE_SAMPLES } from "@/app/specs/mailing-thumbnails/code-samples";
import {
  buildManifest,
  collectAffectedSources,
} from "@/app/specs/mailing-thumbnails/collect-sources";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/mailing-thumbnails/requirements";
import { buildSpecMarkdown } from "@/app/specs/mailing-thumbnails/to-markdown";
import { buildJiraTicket } from "@/app/specs/ui-enhancements/to-jira";
import { downloadTextFile } from "@/components/Specs/download";
import { SpecCodeViewer } from "@/components/Specs/SpecCodeViewer";
import { downloadZip } from "@/components/Specs/zip";

/** How many source files the download collects. */
const AFFECTED_COUNT = AFFECTED_GROUPS.reduce(
  (total, group) => total + group.paths.length,
  0
);

/** The code that belongs to one section. */
const samplesFor = (sectionId: string): readonly CodeSample[] =>
  CODE_SAMPLES.filter((sample) => sample.sectionId === sectionId);

/** The screens a scope answer covers, derived from its requirements. */
const screensFor = (requirementIds: readonly string[]) => {
  const seen = new Map<string, { href: string; label: string }>();

  for (const section of SPEC_SECTIONS) {
    for (const requirement of section.requirements) {
      if (!requirementIds.includes(requirement.id)) {
        continue;
      }

      for (const screen of requirement.screens) {
        seen.set(`${screen.href}${screen.label}`, screen);
      }
    }
  }

  return [...seen.values()];
};

/** A file path, linked to the screen it renders on when one is known. */
const SourceChip = ({ path }: { readonly path: string }) => {
  const screens = SCREEN_LINKS[path];

  if (screens === undefined || screens.length === 0) {
    return (
      <Chip
        label={path}
        size="small"
        sx={{ fontFamily: "monospace", fontSize: 11 }}
        variant="outlined"
      />
    );
  }

  return (
    <Tooltip
      title={`Used on: ${screens.map((screen) => screen.label).join(", ")}`}
    >
      <Chip
        clickable
        component="a"
        href={screens[0].href}
        label={path}
        size="small"
        sx={{ fontFamily: "monospace", fontSize: 11 }}
        variant="outlined"
      />
    </Tooltip>
  );
};

/** Links to the screens where something is visible. */
const ScreenButtons = ({
  screens,
}: {
  readonly screens: readonly { href: string; label: string }[];
}) => {
  if (screens.length === 0) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", flexWrap: "wrap", mt: 2, rowGap: 1 }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Where you&apos;ll see it:
      </Typography>
      {screens.map((screen) => (
        <Button
          endIcon={<OpenInNewIcon />}
          href={screen.href}
          key={`${screen.href}${screen.label}`}
          rel="noopener"
          size="small"
          target="_blank"
          variant="outlined"
        >
          {screen.label}
        </Button>
      ))}
    </Stack>
  );
};

/** Copies one requirement as a ready-to-paste Jira ticket. */
const CopyRequirementButton = ({
  requirement,
  sectionTitle,
}: {
  readonly requirement: Requirement;
  readonly sectionTitle: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
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
const RequirementCard = ({
  requirement,
  sectionTitle,
}: {
  readonly requirement: Requirement;
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

      <ScreenButtons screens={requirement.screens} />

      {requirement.evidence !== undefined && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            In the code:
          </Typography>
          {requirement.evidence.map((path) => (
            <SourceChip key={path} path={path} />
          ))}
        </Stack>
      )}
    </CardContent>
  </Card>
);

/** One reference table. */
const SpecTableBlock = ({
  table,
}: {
  readonly table: NonNullable<SpecSection["tables"]>[number];
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      {table.title}
    </Typography>
    {table.caption !== undefined && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, maxWidth: "72ch" }}
      >
        {table.caption}
      </Typography>
    )}
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {table.headers.map((header) => (
              <TableCell key={header} sx={{ fontWeight: 700 }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.rows.map((row) => (
            <TableRow key={row.join("|")}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex} sx={{ verticalAlign: "top" }}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

/** One code sample, with the screens it appears on and what it covers. */
const CodeBlock = ({ sample }: { readonly sample: CodeSample }) => (
  <Box sx={{ mb: 3 }}>
    <SpecCodeViewer
      code={sample.code}
      filename={sample.filename}
      language={sample.language}
      title={sample.title}
    />
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 1 }}>
      {(SCREEN_LINKS[sample.filename] ?? []).map((screen) => (
        <Chip
          clickable
          component="a"
          href={screen.href}
          key={screen.href}
          label={`Used on: ${screen.label}`}
          size="small"
          variant="outlined"
        />
      ))}
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Covers:
      </Typography>
      {sample.satisfies.map((id) => (
        <Chip
          clickable
          component="a"
          href={`#${id}`}
          key={id}
          label={id}
          size="small"
          sx={{ fontFamily: "monospace", fontSize: 11 }}
          variant="outlined"
        />
      ))}
    </Stack>
  </Box>
);

/** A heading for one of the groups inside a section. */
const GroupHeading = ({ children }: { readonly children: string }) => (
  <Typography
    component="h3"
    variant="h6"
    sx={{ fontWeight: 700, mb: 2, mt: 4 }}
  >
    {children}
  </Typography>
);

/** One section, read top to bottom. */
const SpecSectionBlock = ({ section }: { readonly section: SpecSection }) => {
  const samples = samplesFor(section.id);

  return (
    <Box component="section" id={section.id} sx={{ scrollMarginTop: 24 }}>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
        {section.title}
      </Typography>

      <Typography variant="body1" sx={{ maxWidth: "72ch" }}>
        {section.summary}
      </Typography>

      {section.topics !== undefined && (
        <Stack component="ul" spacing={0.5} sx={{ mb: 3, mt: 1.5, pl: 3 }}>
          {section.topics.map((topic) => (
            <Typography
              component="li"
              key={topic.question}
              variant="body1"
              sx={{ maxWidth: "72ch" }}
            >
              {topic.question}
            </Typography>
          ))}
        </Stack>
      )}

      <Box sx={{ mb: 2, mt: section.topics === undefined ? 2 : 0 }}>
        {section.background.map((paragraph) => (
          <Typography
            key={paragraph.slice(0, 40)}
            variant="body1"
            color="text.secondary"
            sx={{ mb: 1, maxWidth: "72ch" }}
          >
            {paragraph}
          </Typography>
        ))}
      </Box>

      {section.topics !== undefined && (
        <>
          <GroupHeading>Answers</GroupHeading>
          <Stack spacing={2}>
            {section.topics.map((topic) => (
              <Box key={topic.question}>
                {topic.lead !== undefined && (
                  <Typography
                    variant="body1"
                    sx={{ maxWidth: "72ch", mb: 2, mt: 1 }}
                  >
                    {topic.lead}
                  </Typography>
                )}
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      component="h4"
                      variant="subtitle1"
                      sx={{ fontWeight: 600, maxWidth: "72ch" }}
                    >
                      {topic.question}
                    </Typography>
                    {topic.answer.map((paragraph) => (
                      <Typography
                        key={paragraph.slice(0, 40)}
                        variant="body2"
                        sx={{ maxWidth: "72ch", mt: 1 }}
                      >
                        {paragraph}
                      </Typography>
                    ))}

                    <ScreenButtons screens={screensFor(topic.requirementIds)} />

                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ flexWrap: "wrap", mt: 1.5 }}
                    >
                      {topic.requirementIds.map((id) => (
                        <Chip
                          clickable
                          component="a"
                          href={`#${id}`}
                          key={id}
                          label={id}
                          size="small"
                          sx={{ fontFamily: "monospace", fontSize: 11 }}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Stack>
        </>
      )}

      <GroupHeading>Requirements</GroupHeading>
      <Stack spacing={2}>
        {section.requirements.map((requirement) => (
          <RequirementCard
            key={requirement.id}
            requirement={requirement}
            sectionTitle={section.title}
          />
        ))}
      </Stack>

      {section.tables !== undefined && (
        <>
          <GroupHeading>Tables</GroupHeading>
          {section.tables.map((table) => (
            <SpecTableBlock key={table.title} table={table} />
          ))}
        </>
      )}

      {samples.length > 0 && (
        <>
          <GroupHeading>Code</GroupHeading>
          {samples.map((sample) => (
            <CodeBlock key={sample.filename} sample={sample} />
          ))}
        </>
      )}
    </Box>
  );
};

/** Requirements package for the mailing preview thumbnails. */
const MailingThumbnailsSpecPage = () => {
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missingCount, setMissingCount] = useState(0);

  const handleDownloadComponents = (): void => {
    setBusy(true);

    void collectAffectedSources()
      .then(({ entries, missing }) => {
        const generatedOn = new Date().toISOString().slice(0, 10);

        downloadZip(
          `issuer-portal-mailing-thumbnails-v${SPEC_META.version}.zip`,
          [
            {
              contents: buildManifest(missing, CODE_SAMPLES.length),
              path: "README.md",
            },
            {
              contents: buildSpecMarkdown(generatedOn),
              path: "REQUIREMENTS.md",
            },
            ...entries,
            ...CODE_SAMPLES.map((sample) => ({
              contents: sample.code,
              path: `reference/${sample.filename}`,
            })),
          ]
        );
        setMissingCount(missing.length);
        setDownloaded(true);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const handleDownloadMarkdown = (): void => {
    const generatedOn = new Date().toISOString().slice(0, 10);

    downloadTextFile(
      `issuer-portal-mailing-thumbnails-v${SPEC_META.version}.md`,
      buildSpecMarkdown(generatedOn)
    );
    setDownloaded(true);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "flex-start" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            v{SPEC_META.version} · {SPEC_META.status}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {SPEC_META.title}
          </Typography>
        </Box>

        <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              disabled={busy}
              onClick={handleDownloadComponents}
              size="large"
              startIcon={<DownloadIcon />}
              variant="contained"
            >
              {busy ? "Collecting source…" : "Download components (.zip)"}
            </Button>
            <Button
              onClick={handleDownloadMarkdown}
              size="large"
              variant="outlined"
            >
              Requirements (.md)
            </Button>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ maxWidth: "34ch" }}
          >
            {downloaded
              ? missingCount === 0
                ? "Every component included, plus the reference code and requirements."
                : `${missingCount} file(s) unavailable — see README.md in the archive.`
              : `${AFFECTED_COUNT} components, ${CODE_SAMPLES.length} reference files, plus requirements.`}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: "wrap", mb: 4, rowGap: 1 }}
      >
        {SPEC_SECTIONS.map((section) => (
          <Chip
            clickable
            component="a"
            href={`#${section.id}`}
            key={section.id}
            label={section.title}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>

      <Stack
        divider={<Divider sx={{ my: 5 }} />}
        spacing={0}
        sx={{ "& > section": { minWidth: 0 } }}
      >
        {SPEC_SECTIONS.map((section) => (
          <SpecSectionBlock key={section.id} section={section} />
        ))}
      </Stack>
    </Box>
  );
};

export default MailingThumbnailsSpecPage;
