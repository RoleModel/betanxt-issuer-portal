"use client";

import type { LinkProps } from "@mui/material/Link";
import type { TooltipProps } from "@mui/material/Tooltip";
import type { MouseEvent, ReactNode } from "react";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";

import type { GlossaryTermId } from "@/contexts/GlossaryContext";

import { CustomTooltip } from "@/components/ui/CustomToolTip";
import { useGlossary } from "@/contexts/GlossaryContext";
import { termsDefinitions } from "@/lib/termsDefinitions";

export interface GlossaryTooltipProps {
  /**
   * Text to mark up. Defaults to the term's own glossary label, so
   * `<GlossaryTooltip term="recorddate" />` renders "Record Date".
   */
  readonly children?: ReactNode;
  /** Extra props for the underlying link, e.g. an `sx` override. */
  readonly linkProps?: LinkProps;
  /** Runs before the drawer opens, for call sites that also track the click. */
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly placement?: TooltipProps["placement"];
  /** Glossary entry this marker points at. */
  readonly term: GlossaryTermId;
}

/**
 * Inline glossary marker: hover for the definition, click for the full drawer.
 *
 * @remarks
 * Meant to be sprinkled through ordinary copy, so it renders as text that
 * inherits its surroundings and carries a dashed underline as its only
 * affordance — a `Typography` or table cell keeps its own type styles. It is a
 * real button rather than a styled span so it is reachable by keyboard and
 * announced as opening a dialog. The drawer itself is owned by
 * `GlossaryProvider`; this component only names a term.
 *
 * @example
 * ```tsx
 * <Typography>
 *   Shares are counted as of the <GlossaryTooltip term="recorddate" />.
 * </Typography>
 * ```
 */
export const GlossaryTooltip = ({
  children,
  linkProps,
  onClick,
  placement = "top",
  term,
}: GlossaryTooltipProps) => {
  const { openGlossary } = useGlossary();
  const entry = termsDefinitions[term];
  // `sx` accepts a callback, so it is composed through MUI's array form rather
  // than spread — spreading would drop a function override silently.
  const { sx: linkSx, ...restLinkProps } = linkProps ?? {};

  /**
   * Opens the glossary and nothing else.
   *
   * @remarks
   * The marker is meant to sit inside copy that is often itself clickable — a
   * FeatureTile wrapped in a link, a table row, a card that opens a document.
   * Without both of these, clicking a term would open the glossary *and* fire
   * the surface underneath it: `stopPropagation` keeps ancestor React handlers
   * out of it, and `preventDefault` cancels the navigation when the ancestor is
   * a real anchor, which is how a tile with an `href` would otherwise download
   * its PDF behind the drawer.
   */
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);
    openGlossary(term);
  };

  return (
    <CustomTooltip placement={placement} title={entry.definition}>
      <Link
        aria-haspopup="dialog"
        component="button"
        type="button"
        underline="none"
        {...restLinkProps}
        onClick={handleClick}
        sx={[
          {
            background: "none",
            border: 0,
            borderBottom: "1px dashed",
            borderBottomColor: "currentColor",
            color: "inherit",
            cursor: "help",
            display: "inline",
            font: "inherit",
            letterSpacing: "inherit",
            p: 0,
            textAlign: "inherit",
            verticalAlign: "baseline",
            "&:hover": {
              borderBottomStyle: "solid",
              color: "inherit",
            },
            "&:focus-visible": {
              borderRadius: 1,
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 2,
            },
          },
          ...(Array.isArray(linkSx) ? linkSx : [linkSx]),
        ]}
      >
        {children ?? entry.term}
      </Link>
    </CustomTooltip>
  );
};

/**
 * A glossary term that explains itself on hover but is not itself clickable.
 *
 * @remarks
 * For terms that sit inside a control which already owns the click — a
 * navigation tab, a menu item, a sort button. {@link GlossaryTooltip} renders a
 * real `<button>`, and nesting one inside a tab breaks both the navigation and
 * the announced role, so those places get the definition without the
 * click-through to the drawer. Dotted rather than dashed, so the two are
 * distinguishable: dashed means "opens the glossary", dotted means "hover me".
 */
export const GlossaryHint = ({
  children,
  placement = "top",
  term,
}: Omit<GlossaryTooltipProps, "linkProps" | "onClick">) => {
  const entry = termsDefinitions[term];

  return (
    <CustomTooltip placement={placement} title={entry.definition}>
      <Box
        component="span"
        sx={{
          borderBottom: "1px dotted",
          borderBottomColor: "currentColor",
          cursor: "help",
        }}
      >
        {children ?? entry.term}
      </Box>
    </CustomTooltip>
  );
};

export default GlossaryTooltip;
