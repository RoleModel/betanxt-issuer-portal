"use client";

import type { SpecPackage } from "@/components/Specs/spec-package";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/mailing-thumbnails/affected-files";
import { CODE_SAMPLES } from "@/app/specs/mailing-thumbnails/code-samples";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/mailing-thumbnails/requirements";
import { SpecPage } from "@/components/Specs/SpecPage";

/**
 * Everything that makes this package itself.
 *
 * @remarks
 * The page, the source collector, and the Markdown writer are shared with every
 * other spec, so what is left here is content and the handful of choices that
 * differ between packages.
 */
const SPEC: SpecPackage = {
  abstract:
    "Requirements for clickable mailing preview thumbnails (Full Set, NAA, Electronic) and the document generators behind them.",
  archive: { codeFolder: "reference", groups: AFFECTED_GROUPS },
  codeSamples: CODE_SAMPLES,
  meta: SPEC_META,
  screenLinks: SCREEN_LINKS,
  sections: SPEC_SECTIONS,
  slug: "mailing-thumbnails",
};

/** Requirements package for the mailing preview thumbnails. */
const MailingThumbnailsSpecPage = () => <SpecPage spec={SPEC} />;

export default MailingThumbnailsSpecPage;
