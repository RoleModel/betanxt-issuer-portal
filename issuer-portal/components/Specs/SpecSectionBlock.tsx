"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import type {
  CodeSample,
  ScreenLinkMap,
  SpecPackage,
  SpecSection,
  SpecTable,
} from "@/components/Specs/spec-package";

import { SpecCodeViewer } from "@/components/Specs/SpecCodeViewer";
import {
  samplesForSection,
  screensForRequirements,
} from "@/components/Specs/spec-package";
import { SpecRequirementCard } from "@/components/Specs/SpecRequirementCard";
import { SpecScreenButtons } from "@/components/Specs/SpecScreenLinks";

/**
 * One spec section, read top to bottom.
 *
 * @remarks
 * The same shape every time: the request, the questions it asked with their
 * answers, the requirements those answers commit to, the reference tables, and
 * the related code last. A reader who scrolls a section from its heading to the
 * next one has read the whole of it.
 */

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

/** One reference table. */
const SpecTableBlock = ({ table }: { readonly table: SpecTable }) => (
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

/**
 * One code sample, with the screens it appears on and what it covers.
 *
 * @remarks
 * `showsAsBuilt` marks whether the sample is shipping code or a proposal, which
 * only matters to a package documenting what already exists. `hidesChips` keeps
 * the row out of the layout for a package whose requirements already name every
 * file, without giving that package its own copy of the block.
 */
const SpecCodeBlock = ({
  hidesChips,
  sample,
  screenLinks,
  showsAsBuilt,
}: {
  readonly hidesChips: boolean;
  readonly sample: CodeSample;
  readonly screenLinks: ScreenLinkMap;
  readonly showsAsBuilt: boolean;
}) => (
  <Box sx={{ mb: 3 }}>
    <SpecCodeViewer
      code={sample.code}
      filename={sample.filename}
      language={sample.language}
      title={sample.title}
    />
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
        display: hidesChips ? "none" : "flex",
        flexWrap: "wrap",
        mt: 1,
      }}
    >
      {showsAsBuilt ? (
        <Chip
          color={sample.asBuilt === true ? "default" : "primary"}
          label={sample.asBuilt === true ? "As built" : "As built + change"}
          size="small"
          variant="outlined"
        />
      ) : null}
      {(screenLinks[sample.filename] ?? []).map((screen) => (
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

/** Requirement ids, as links to the cards they name. */
const RequirementChips = ({ ids }: { readonly ids: readonly string[] }) => (
  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", mt: 1.5 }}>
    {ids.map((id) => (
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
);

export const SpecSectionBlock = ({
  section,
  spec,
}: {
  readonly section: SpecSection;
  readonly spec: SpecPackage;
}) => {
  const samples = samplesForSection(spec, section.id);

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

                    <SpecScreenButtons
                      screens={screensForRequirements(
                        spec,
                        topic.requirementIds
                      )}
                    />

                    <RequirementChips ids={topic.requirementIds} />
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
          <SpecRequirementCard
            key={requirement.id}
            requirement={requirement}
            screenLinks={spec.screenLinks}
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
            <SpecCodeBlock
              hidesChips={spec.hidesCodeChips === true}
              key={sample.filename}
              sample={sample}
              screenLinks={spec.screenLinks}
              showsAsBuilt={spec.showsAsBuilt === true}
            />
          ))}
        </>
      )}
    </Box>
  );
};
