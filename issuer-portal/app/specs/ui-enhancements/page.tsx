"use client";

import type { RequirementStatus } from "@/app/specs/ui-enhancements/requirements";

import DownloadIcon from "@mui/icons-material/Download";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useState } from "react";

import { CODE_SAMPLES } from "@/app/specs/ui-enhancements/code-samples";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/ui-enhancements/requirements";
import { buildSpecMarkdown } from "@/app/specs/ui-enhancements/to-markdown";
import { downloadTextFile } from "@/components/Specs/download";
import { SpecCodeViewer } from "@/components/Specs/SpecCodeViewer";

/** Colour and wording for each requirement status badge. */
const STATUS_PRESENTATION: Record<
  RequirementStatus,
  { color: "default" | "info" | "warning"; label: string }
> = {
  confirmed: { color: "info", label: "Confirmed" },
  "decision-needed": { color: "warning", label: "Decision needed" },
  proposed: { color: "default", label: "Proposed" },
};

/**
 * Internal requirements package for the three requested UI enhancements.
 *
 * @remarks
 * Rendered as a route rather than shipped as a document so it stays reachable
 * from the app people are being asked to change, renders in the client's own
 * theme, and can show reference implementations with real highlighting. The
 * download button emits the same content as Markdown for anyone who needs it
 * outside the portal.
 *
 * The page is intentionally read-only and data-driven: everything it renders
 * comes from `requirements.ts` and `code-samples.ts`, so a requirement change
 * is a one-file diff that a reviewer can read without parsing JSX.
 */
const UiEnhancementSpecPage = () => {
  const [downloaded, setDownloaded] = useState(false);

  const sectionCounts = useMemo(
    () =>
      SPEC_SECTIONS.map((section) => ({
        decisions: section.requirements.filter(
          (requirement) => requirement.status === "decision-needed"
        ).length,
        id: section.id,
        total: section.requirements.length,
      })),
    []
  );

  const handleDownload = useCallback((): void => {
    // Stamped at click time rather than at module load, so a long-lived tab
    // does not hand out a file dated when the page was first opened.
    const generatedOn = new Date().toISOString().slice(0, 10);

    downloadTextFile(
      `issuer-portal-ui-enhancements-v${SPEC_META.version}.md`,
      buildSpecMarkdown(generatedOn)
    );
    setDownloaded(true);
  }, []);

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
            Requirements package · v{SPEC_META.version} · {SPEC_META.status}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {SPEC_META.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: "60ch", mt: 1 }}
          >
            Business and functional requirements for the percentage/count
            display toggle, tooltip and glossary navigation, and glossary
            formatting. Every claim about current behaviour was read out of the
            source files cited under each requirement.
          </Typography>
        </Box>

        <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          <Button
            onClick={handleDownload}
            size="large"
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            Download package (.md)
          </Button>
          {downloaded ? (
            <Typography variant="caption" color="text.secondary">
              Individual files are downloadable from each code block.
            </Typography>
          ) : null}
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ mb: 4, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Contents
        </Typography>
        <Stack spacing={1}>
          {SPEC_SECTIONS.map((section) => {
            const counts = sectionCounts.find(
              (entry) => entry.id === section.id
            );

            return (
              <Stack
                key={section.id}
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 0.5, sm: 2 }}
                alignItems={{ sm: "baseline" }}
              >
                <Link
                  href={`#${section.id}`}
                  underline="hover"
                  sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {section.title}
                </Link>
                <Typography variant="body2" color="text.secondary">
                  {section.summary}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Chip
                    label={`${counts?.total ?? 0} reqs`}
                    size="small"
                    variant="outlined"
                  />
                  {(counts?.decisions ?? 0) > 0 && (
                    <Chip
                      color="warning"
                      label={`${counts?.decisions ?? 0} decisions`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Paper>

      {SPEC_SECTIONS.map((section) => {
        const samples = CODE_SAMPLES.filter(
          (sample) => sample.sectionId === section.id
        );

        return (
          <Box
            component="section"
            id={section.id}
            key={section.id}
            sx={{ mb: 8, scrollMarginTop: 96 }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {section.title}
            </Typography>

            {section.background.map((paragraph) => (
              <Typography
                key={paragraph.slice(0, 40)}
                variant="body1"
                sx={{ mb: 1.5, maxWidth: "72ch" }}
              >
                {paragraph}
              </Typography>
            ))}

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="h6"
              component="h3"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Requirements
            </Typography>

            <Stack spacing={2}>
              {section.requirements.map((requirement) => (
                <Card key={requirement.id} variant="outlined">
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
                      <Typography
                        component="h4"
                        variant="subtitle1"
                        sx={{ fontWeight: 600 }}
                      >
                        {requirement.title}
                      </Typography>
                      <Chip
                        color={STATUS_PRESENTATION[requirement.status].color}
                        label={STATUS_PRESENTATION[requirement.status].label}
                        size="small"
                      />
                    </Stack>

                    <Typography variant="body1" sx={{ maxWidth: "72ch" }}>
                      {requirement.statement}
                    </Typography>

                    {requirement.rationale !== undefined && (
                      <Box
                        sx={{
                          borderLeft: "3px solid",
                          borderColor: "divider",
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

                    <Typography variant="subtitle2" sx={{ mb: 0, mt: 2 }}>
                      Acceptance criteria
                    </Typography>
                    <List dense disablePadding>
                      {requirement.acceptance.map((criterion) => (
                        <ListItem
                          key={criterion}
                          disableGutters
                          sx={{ alignItems: "flex-start" }}
                        >
                          <ListItemText
                            primary={criterion}
                            slotProps={{
                              primary: {
                                sx: { maxWidth: "72ch" },
                                variant: "body2",
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {requirement.evidence !== undefined && (
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ flexWrap: "wrap", mt: 1.5 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mr: 0.5 }}
                        >
                          Verified in:
                        </Typography>
                        {requirement.evidence.map((path) => (
                          <Chip
                            key={path}
                            label={path}
                            size="small"
                            sx={{ fontFamily: "monospace", fontSize: 11 }}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {section.tables !== undefined && (
              <>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600, mb: 2, mt: 5 }}
                >
                  Reference tables
                </Typography>
                <Stack spacing={3}>
                  {section.tables.map((table) => (
                    <Box key={table.title}>
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
                                <TableCell
                                  key={header}
                                  sx={{ fontWeight: 700 }}
                                >
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
                  ))}
                </Stack>
              </>
            )}

            {section.openQuestions !== undefined && (
              <>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600, mb: 2, mt: 5 }}
                >
                  Open questions
                </Typography>
                <Stack spacing={1.5}>
                  {section.openQuestions.map((item) => (
                    <Alert
                      key={item.question}
                      severity="warning"
                      variant="outlined"
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.question}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{item.owner}</strong> — recommendation:{" "}
                        {item.recommendation}
                      </Typography>
                    </Alert>
                  ))}
                </Stack>
              </>
            )}

            {samples.length > 0 && (
              <>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600, mb: 1, mt: 5 }}
                >
                  Reference implementations
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, maxWidth: "72ch" }}
                >
                  Complete enough to paste against the portal&apos;s existing
                  helpers. Each block downloads on its own, or arrives with the
                  full package above.
                </Typography>
                <Stack spacing={3}>
                  {samples.map((sample) => (
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mr: 0.5 }}
                        >
                          Satisfies:
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
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default UiEnhancementSpecPage;
