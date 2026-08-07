"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { maxPreviewedPieces } from "./layout";
import { brandConfigs } from "@/utils/brandConfig";

/** Mock-api base, matching the rest of the app's hooks. */
const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

/** One piece of the Full Set package, thumbnailed in the tile's fan. */
export interface FullSetPiece {
  readonly key: string;
  readonly label: string;
  readonly fileUrl: string;
}

/**
 * The manifest written next to each client's split Full Set pieces by
 * scripts/split-full-set-pdfs.ts. It stands in for the mailing-materials
 * records the operations team will store in the database.
 */
interface PieceManifest {
  readonly pieces: readonly { readonly file: string; readonly label: string }[];
}

const isManifestPiece = (
  value: unknown
): value is { file: string; label: string } =>
  typeof value === "object" &&
  value !== null &&
  "file" in value &&
  typeof value.file === "string" &&
  "label" in value &&
  typeof value.label === "string";

const isPieceManifest = (value: unknown): value is PieceManifest => {
  if (typeof value !== "object" || value === null || !("pieces" in value)) {
    return false;
  }
  const { pieces } = value;
  return (
    Array.isArray(pieces) &&
    pieces.every((piece: unknown) => isManifestPiece(piece))
  );
};

const fetchManifest = async (
  url: string
): Promise<PieceManifest | undefined> => {
  const response = await fetch(url);
  if (!response.ok) {
    return undefined;
  }
  const json: unknown = await response.json();
  return isPieceManifest(json) ? json : undefined;
};

/** Every file the three tiles preview, for one client. */
export interface MailingPreviewSources {
  /** Split pieces in mailing order, capped at {@link maxPreviewedPieces}. */
  readonly fullSetPieces: readonly FullSetPiece[];
  readonly naaUrl: string;
  readonly electronicPngUrl: string;
  /** The rendered Electronic notice email, themed for this client. */
  readonly electronicUrl: string;
}

/**
 * Resolves everything the Primary Mailing Summary previews for one client.
 *
 * @param ticker - Upper-case client ticker; an empty string fetches nothing.
 * @param fallbackBrandColor - Used when the client has no brand config.
 *
 * @remarks
 * The Full Set pieces come from the client's split-package manifest — the
 * prototype's stand-in for the mailing materials the operations team stores in
 * the database — and a 404 (an unsplit package) falls back to previewing the
 * merged package as a single piece, so the tile always has something to show.
 */
export const useMailingPreviews = (
  ticker: string,
  fallbackBrandColor: string
): MailingPreviewSources => {
  const { data: pieceManifest } = useSWR<PieceManifest | undefined>(
    ticker.length > 0
      ? `/mock-mailings/${ticker}/full-set/manifest.json`
      : null,
    fetchManifest,
    { revalidateOnFocus: false }
  );

  // Brand name and colour drive the Electronic email's per-client theming.
  // The legal name is the brandConfigs key (e.g. "The Wendy's Company").
  const [companyLegal, brand] = useMemo(
    () =>
      Object.entries(brandConfigs).find(
        ([, config]) => config.ticker?.toUpperCase() === ticker
      ) ?? [undefined, undefined],
    [ticker]
  );

  return useMemo(() => {
    const company = brand?.companyName ?? ticker;

    const fromManifest = (pieceManifest?.pieces ?? []).map((piece) => ({
      key: piece.file,
      label: piece.label,
      fileUrl: `/mock-mailings/${ticker}/full-set/${piece.file}`,
    }));

    const fullSetPieces =
      fromManifest.length > 0
        ? fromManifest.slice(0, maxPreviewedPieces)
        : [
            {
              key: "full-set-package",
              label: "Complete Proxy Package",
              fileUrl: `/mock-mailings/${ticker}/full-set.pdf`,
            },
          ];

    // Every client-identifying field must be overridden here — the preview
    // route's fixture defaults are Woodward's real notice copy, so any field
    // left unset would leak Woodward's legal name, proxy links, and contact
    // emails into another client's preview.
    const electronicUrl = `${apiBase}/emails/preview?${new URLSearchParams({
      template: "mailing-electronic-notice",
      format: "html",
      company,
      companyLegal: companyLegal ?? company,
      color: brand?.primaryColor ?? fallbackBrandColor,
      proxyPushUrl: `https://www.proxypush.com/${ticker}`,
      proxyPushLabel: `www.proxypush.com/${ticker}`,
      voteSiteUrl: `https://www.proxydocs.com/${ticker}`,
      ...(brand && {
        printedContactEmail: `investor.relations@${brand.domain}`,
        questionsContactEmail: `proxyvoting@${brand.domain}`,
      }),
    }).toString()}`;

    return {
      fullSetPieces,
      naaUrl: `/mock-mailings/${ticker}/naa.pdf`,
      electronicPngUrl: `/mock-mailings/${ticker}/electronic.png`,
      electronicUrl,
    };
  }, [pieceManifest, ticker, brand, companyLegal, fallbackBrandColor]);
};
