"use client";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { ScreenLink } from "@/components/Specs/spec-package";

/**
 * The two ways a spec points at the running app.
 *
 * @remarks
 * Everything in a spec that a reader might want to go and look at goes through
 * one of these, so "where you'll see it" reads the same under a requirement, a
 * scope answer, and a code sample.
 */

/**
 * A file path, linked to the screen it renders on when one is known.
 *
 * @remarks
 * A package's screen map only covers files with a screen of their own, so shared
 * helpers fall back to a plain chip rather than a link that goes nowhere.
 */
export const SpecSourceChip = ({
  path,
  screens,
}: {
  readonly path: string;
  readonly screens?: readonly ScreenLink[];
}) => {
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
export const SpecScreenButtons = ({
  screens,
}: {
  readonly screens: readonly ScreenLink[];
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
