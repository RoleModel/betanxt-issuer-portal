"use client";

import type { SxProps, Theme } from "@mui/material/styles";

import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useState } from "react";

import type { CodeLanguage, TokenKind } from "@/components/Specs/highlight";

import { downloadTextFile } from "@/components/Specs/download";
import { tokenize } from "@/components/Specs/highlight";

/**
 * Token colours, keyed by semantic slot.
 *
 * @remarks
 * Read off `theme.vars` rather than fixed hex so the block inherits whichever
 * client theme is active and flips correctly in dark mode. Slots that should
 * read as "ordinary code" fall through to `text.primary` instead of getting a
 * near-identical accent, which keeps the highlighting legible rather than
 * decorative.
 */
const tokenColor = (theme: Theme): Record<TokenKind, string> => ({
  attribute: theme.vars.palette.secondary.main,
  comment: theme.vars.palette.text.disabled,
  function: theme.vars.palette.info.main,
  heading: theme.vars.palette.primary.main,
  keyword: theme.vars.palette.secondary.main,
  number: theme.vars.palette.warning.main,
  operator: theme.vars.palette.text.secondary,
  plain: theme.vars.palette.text.primary,
  property: theme.vars.palette.info.main,
  punctuation: theme.vars.palette.text.secondary,
  string: theme.vars.palette.success.main,
  tag: theme.vars.palette.primary.main,
  type: theme.vars.palette.primary.main,
});

export interface SpecCodeViewerProps {
  /** Source to display. Rendered verbatim; also what copy/download emit. */
  readonly code: string;
  /**
   * Filename offered by the download button, e.g. `useDisplayMode.ts`.
   *
   * @remarks
   * Doubles as the block's caption, so it should be the path an engineer would
   * actually create — the spec is only useful if the file lands where it says.
   */
  readonly filename: string;
  readonly language: CodeLanguage;
  /** Hide line numbers for short inline fragments. Default `true`. */
  readonly showLineNumbers?: boolean;
  readonly sx?: SxProps<Theme>;
  /** One line of context above the code, e.g. what the snippet is for. */
  readonly title?: string;
}

/**
 * A read-only code block with highlighting, copy, and per-file download.
 *
 * @remarks
 * The spec page is meant to be handed to engineers for estimation, so every
 * snippet has to be extractable without selecting text out of a rendered page —
 * hence a download button per block rather than only a bundle download at the
 * top. Highlighting is computed with `useMemo` keyed on the source because the
 * page renders a dozen blocks at once and none of them ever change after mount.
 *
 * @example
 * ```tsx
 * <SpecCodeViewer
 *   code={DISPLAY_MODE_HOOK}
 *   filename="hooks/useDisplayMode.ts"
 *   language="typescript"
 * />
 * ```
 */
export const SpecCodeViewer = ({
  code,
  filename,
  language,
  showLineNumbers = true,
  sx,
  title,
}: SpecCodeViewerProps) => {
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => code.replace(/\n$/u, "").split("\n"), [code]);
  const tokensByLine = useMemo(
    () => lines.map((line) => tokenize(line, language)),
    [language, lines]
  );

  const handleCopy = useCallback((): void => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [code]);

  const handleDownload = useCallback((): void => {
    downloadTextFile(filename.split("/").pop() ?? filename, code);
  }, [code, filename]);

  const gutterWidth = `${String(lines.length).length + 1}ch`;

  return (
    <Box
      sx={[
        {
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          bgcolor: "action.hover",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <Typography
            component="span"
            variant="body2"
            sx={{
              fontFamily: "monospace",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {filename}
          </Typography>
          <Chip label={language} size="small" variant="outlined" />
          {title !== undefined && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={copied ? "Copied" : "Copy to clipboard"}>
            <IconButton
              aria-label={`Copy ${filename}`}
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
          <Tooltip title="Download this file">
            <IconButton
              aria-label={`Download ${filename}`}
              onClick={handleDownload}
              size="small"
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        component="pre"
        tabIndex={0}
        aria-label={`${filename} source`}
        sx={{
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.65,
          m: 0,
          maxHeight: 560,
          overflow: "auto",
          px: 2,
          py: 1.5,
        }}
      >
        <Box component="code" sx={{ display: "block" }}>
          {tokensByLine.map((tokens, lineIndex) => (
            <Box
              component="span"

              key={lineIndex}
              sx={{ display: "block", whiteSpace: "pre" }}
            >
              {showLineNumbers ? (
                <Box
                  aria-hidden
                  component="span"
                  sx={{
                    color: "text.disabled",
                    display: "inline-block",
                    textAlign: "right",
                    userSelect: "none",
                    width: gutterWidth,
                    mr: 2,
                  }}
                >
                  {lineIndex + 1}
                </Box>
              ) : null}
              {tokens.map((token, tokenIndex) => (
                <Box
                  component="span"

                  key={tokenIndex}
                  sx={(theme) => ({
                    color: tokenColor(theme)[token.kind],
                    fontStyle: token.kind === "comment" ? "italic" : "normal",
                    fontWeight:
                      token.kind === "keyword" || token.kind === "heading"
                        ? 600
                        : 400,
                  })}
                >
                  {token.value}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SpecCodeViewer;
