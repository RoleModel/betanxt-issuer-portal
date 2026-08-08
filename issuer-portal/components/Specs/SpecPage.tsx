"use client";

import DownloadIcon from "@mui/icons-material/Download";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { SpecPackage } from "@/components/Specs/spec-package";

import {
  buildManifest,
  collectAffectedSources,
} from "@/components/Specs/archive";
import { downloadTextFile } from "@/components/Specs/download";
import {
  affectedFileCount,
  downloadBaseName,
} from "@/components/Specs/spec-package";
import { SpecSectionBlock } from "@/components/Specs/SpecSectionBlock";
import { buildSpecMarkdown } from "@/components/Specs/to-markdown";
import { downloadZip } from "@/components/Specs/zip";

/**
 * Renders one spec package: its heading, its downloads, and its sections.
 *
 * @remarks
 * A plain document rather than a tree. Every reader wants a different part of a
 * spec — the scope, one requirement to turn into a ticket, the reference tables
 * — and hiding those behind branches meant finding a heading before you could
 * read anything. It scrolls; browser search finds everything.
 *
 * Each package's route is a few lines that hand this component a `SpecPackage`,
 * so all four specs stay identical in behaviour by construction rather than by
 * four copies being kept in step.
 */
export const SpecPage = ({ spec }: { readonly spec: SpecPackage }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missingCount, setMissingCount] = useState(0);

  const affectedCount = affectedFileCount(spec);
  const baseName = downloadBaseName(spec);

  const handleDownloadComponents = (): void => {
    setBusy(true);

    void collectAffectedSources(spec.archive)
      .then(({ entries, missing }) => {
        // Stamped at click time so a long-lived tab does not hand out a file
        // dated when the page was first opened.
        const generatedOn = new Date().toISOString().slice(0, 10);

        downloadZip(`${baseName}.zip`, [
          {
            contents: buildManifest(
              spec.archive,
              missing,
              spec.codeSamples.length
            ),
            path: "README.md",
          },
          {
            contents: buildSpecMarkdown(spec, generatedOn),
            path: "REQUIREMENTS.md",
          },
          ...entries,
          ...spec.codeSamples.map((sample) => ({
            contents: sample.code,
            path: `${spec.archive.codeFolder}/${sample.filename}`,
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

    downloadTextFile(`${baseName}.md`, buildSpecMarkdown(spec, generatedOn));
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
            v{spec.meta.version} · {spec.meta.status}
          </Typography>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {spec.meta.title}
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
              : `${affectedCount} components, ${spec.codeSamples.length} reference files, plus requirements.`}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: "wrap", mb: 4, rowGap: 1 }}
      >
        {spec.sections.map((section) => (
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
        {spec.sections.map((section) => (
          <SpecSectionBlock key={section.id} section={section} spec={spec} />
        ))}
      </Stack>
    </Box>
  );
};
