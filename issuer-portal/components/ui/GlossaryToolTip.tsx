"use client";

import type { LinkProps } from "@mui/material/Link";
import type { TooltipProps } from "@mui/material/Tooltip";
import type { MouseEvent, ReactNode } from "react";

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

  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
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
              color: "primary.main",
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

export default GlossaryTooltip;
