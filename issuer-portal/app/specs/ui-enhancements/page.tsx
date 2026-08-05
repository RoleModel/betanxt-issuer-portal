"use client";

import type {
  Requirement,
  SpecSection,
} from "@/app/specs/ui-enhancements/requirements";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useEffect, useState } from "react";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/ui-enhancements/affected-files";
import { CODE_SAMPLES } from "@/app/specs/ui-enhancements/code-samples";
import {
  buildManifest,
  collectAffectedSources,
} from "@/app/specs/ui-enhancements/collect-sources";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/ui-enhancements/requirements";
import { buildJiraTicket } from "@/app/specs/ui-enhancements/to-jira";
import { buildSpecMarkdown } from "@/app/specs/ui-enhancements/to-markdown";
import { downloadTextFile } from "@/components/Specs/download";
import { SpecCodeViewer } from "@/components/Specs/SpecCodeViewer";
import { downloadZip } from "@/components/Specs/zip";

/** How many source files the download collects. */
const AFFECTED_COUNT = AFFECTED_GROUPS.reduce(
  (total, group) => total + group.paths.length,
  0
);

/** Node id for one of a section's groups. */
const groupId = (sectionId: string, group: string): string =>
  `${sectionId}::${group}`;

const CODE_NODE_ID = "code";

/** Every id in the tree, for expand-all. */
const ALL_NODE_IDS: readonly string[] = [
  ...SPEC_SECTIONS.flatMap((section) => [
    section.id,
    groupId(section.id, "scope"),
    groupId(section.id, "requirements"),
    groupId(section.id, "tables"),
  ]),
  CODE_NODE_ID,
];

/** Sections and their scope open, detail closed, code open. */
const DEFAULT_EXPANDED: readonly string[] = [
  ...SPEC_SECTIONS.flatMap((section) =>
    section.isAppendix === true
      ? []
      : [section.id, groupId(section.id, "scope")]
  ),
  CODE_NODE_ID,
];

/**
 * Which branches must be open for a requirement to be on screen.
 *
 * @param requirementId - The requirement being linked to.
 * @returns Node ids to expand, or an empty list when the id is unknown.
 */
const ancestorsOf = (requirementId: string): readonly string[] => {
  const section = SPEC_SECTIONS.find((candidate) =>
    candidate.requirements.some(
      (requirement) => requirement.id === requirementId
    )
  );

  return section === undefined
    ? []
    : [section.id, groupId(section.id, "requirements")];
};

/**
 * The screens a scope answer covers.
 *
 * @param requirementIds - Requirements the answer points at.
 * @returns Their screens, deduplicated by address and label.
 *
 * @remarks
 * Derived rather than hand-authored so a scope card can never claim a screen
 * its own requirements do not mention.
 */
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

/**
 * A file path, linked to the screen it renders on when one is known.
 *
 * @remarks
 * `SCREEN_LINKS` only covers files with a screen of their own, so shared
 * helpers fall back to a plain chip rather than a link that goes nowhere.
 */
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

/**
 * Copies one requirement as a ready-to-paste Jira ticket.
 *
 * @remarks
 * Estimating from this spec means moving each requirement into a ticket.
 * Copying the whole thing — statement, reasoning, acceptance criteria, and a
 * link back — removes the retyping and stops the ticket drifting from the
 * requirement it came from.
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

/**
 * One requirement, as a card.
 *
 * @remarks
 * Cards rather than nested tree items: a requirement is read whole — statement,
 * reasoning, acceptance criteria — so collapsing them individually would hide
 * the thing the reader opened the branch for. The branch opens; the cards are
 * all there.
 */
const RequirementCard = ({
  requirement,
  sectionTitle,
}: {
  readonly requirement: Requirement;
  readonly sectionTitle: string;
}) => (
  <Card id={requirement.id} variant="outlined" sx={{ scrollMarginTop: 96 }}>
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

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexWrap: "wrap", mt: 2, rowGap: 1 }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
          Where you&apos;ll see it:
        </Typography>
        {requirement.screens.map((screen) => (
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
  <Box sx={{ pb: 3, pl: 1 }}>
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
                <TableCell
                  // eslint-disable-next-line react/no-array-index-key -- Cells are positional within a static row.
                  key={cellIndex}
                  sx={{ verticalAlign: "top" }}
                >
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

/**
 * Requirements package, as a collapsible tree.
 *
 * @remarks
 * A tree because the document is read in pieces: one reader wants the scope,
 * another wants a single requirement to turn into a ticket, a third wants the
 * widget tables. Everything opens from a heading rather than through a scroll.
 *
 * Sections and their scope start open, detail starts closed, and the code
 * branch at the end starts open with every block visible.
 */
const UiEnhancementSpecPage = () => {
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    ...DEFAULT_EXPANDED,
  ]);

  // A link ending `#PCT-05` has to open its branches before the browser can
  // scroll to it — the node is not in the DOM while collapsed.
  useEffect(() => {
    const requirementId = globalThis.location.hash.replace("#", "");
    const ancestors = ancestorsOf(requirementId);

    if (ancestors.length === 0) {
      return;
    }

    setExpandedItems((current) => [...new Set([...current, ...ancestors])]);
    globalThis.setTimeout(() => {
      document
        .querySelector(`#${CSS.escape(requirementId)}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

  const handleDownloadComponents = (): void => {
    setBusy(true);

    void collectAffectedSources()
      .then(({ entries, missing }) => {
        // Stamped at click time so a long-lived tab does not hand out a file
        // dated when the page was first opened.
        const generatedOn = new Date().toISOString().slice(0, 10);

        downloadZip(`issuer-portal-ui-enhancements-v${SPEC_META.version}.zip`, [
          {
            contents: buildManifest(missing, CODE_SAMPLES.length),
            path: "README.md",
          },
          { contents: buildSpecMarkdown(generatedOn), path: "REQUIREMENTS.md" },
          ...entries,
          ...CODE_SAMPLES.map((sample) => ({
            contents: sample.code,
            path: `proposed/${sample.filename}`,
          })),
        ]);
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
      `issuer-portal-ui-enhancements-v${SPEC_META.version}.md`,
      buildSpecMarkdown(generatedOn)
    );
    setDownloaded(true);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
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
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: "60ch", mt: 1 }}
          >
            Open a heading to read it.
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

      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Button
          onClick={() => {
            setExpandedItems([...ALL_NODE_IDS]);
          }}
          size="small"
          startIcon={<UnfoldMoreIcon />}
        >
          Expand all
        </Button>
        <Button
          onClick={() => {
            setExpandedItems([]);
          }}
          size="small"
          startIcon={<UnfoldLessIcon />}
        >
          Collapse all
        </Button>
      </Stack>

      <SimpleTreeView
        expandedItems={expandedItems}
        onExpandedItemsChange={(_event, itemIds) => {
          setExpandedItems(itemIds);
        }}
      >
        {SPEC_SECTIONS.map((section) => (
          <TreeItem
            itemId={section.id}
            key={section.id}
            label={
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "baseline" }}
                spacing={{ xs: 0, sm: 1.5 }}
                sx={{ py: 1 }}
              >
                <Typography
                  variant="h6"
                  component="span"
                  sx={{ fontWeight: 700 }}
                >
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.summary}
                </Typography>
              </Stack>
            }
          >
            <Box sx={{ pb: 2, pl: 1 }}>
              {section.background.map((paragraph) => (
                <Typography
                  key={paragraph.slice(0, 40)}
                  variant="body1"
                  sx={{ mb: 1, maxWidth: "72ch" }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Box>

            {section.topics !== undefined && (
              <TreeItem
                itemId={groupId(section.id, "scope")}
                label={
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, py: 0.5 }}
                  >
                    Scope ({section.topics.length})
                  </Typography>
                }
              >
                <Stack spacing={2} sx={{ pb: 2, pl: 1, pr: 1 }}>
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
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              alignItems: "center",
                              flexWrap: "wrap",
                              mt: 1.5,
                              rowGap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mr: 0.5 }}
                            >
                              Where you&apos;ll see it:
                            </Typography>
                            {screensFor(topic.requirementIds).map((screen) => (
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
                                onClick={() => {
                                  setExpandedItems((current) => [
                                    ...new Set([
                                      ...current,
                                      ...ancestorsOf(id),
                                    ]),
                                  ]);
                                }}
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
              </TreeItem>
            )}

            <TreeItem
              itemId={groupId(section.id, "requirements")}
              label={
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, py: 0.5 }}
                >
                  Requirements ({section.requirements.length})
                </Typography>
              }
            >
              <Stack spacing={2} sx={{ pb: 2, pl: 1, pr: 1 }}>
                {section.requirements.map((requirement) => (
                  <RequirementCard
                    key={requirement.id}
                    requirement={requirement}
                    sectionTitle={section.title}
                  />
                ))}
              </Stack>
            </TreeItem>

            {section.tables !== undefined && (
              <TreeItem
                itemId={groupId(section.id, "tables")}
                label={
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, py: 0.5 }}
                  >
                    Tables ({section.tables.length})
                  </Typography>
                }
              >
                {section.tables.map((table) => (
                  <SpecTableBlock key={table.title} table={table} />
                ))}
              </TreeItem>
            )}
          </TreeItem>
        ))}

        <TreeItem
          itemId={CODE_NODE_ID}
          label={
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, py: 1 }}
            >
              Code ({CODE_SAMPLES.length})
            </Typography>
          }
        >
          <Stack spacing={3} sx={{ pb: 2, pl: 1 }}>
            {CODE_SAMPLES.map((sample) => (
              <Box key={sample.filename}>
                <SpecCodeViewer
                  code={sample.code}
                  filename={sample.filename}
                  language={sample.language}
                  title={sample.title}
                />
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexWrap: "wrap", mt: 1 }}
                >
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
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mr: 0.5 }}
                  >
                    Covers:
                  </Typography>
                  {sample.satisfies.map((id) => (
                    <Chip
                      key={id}
                      label={id}
                      size="small"
                      sx={{ fontFamily: "monospace", fontSize: 11 }}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </TreeItem>
      </SimpleTreeView>
    </Box>
  );
};

export default UiEnhancementSpecPage;
