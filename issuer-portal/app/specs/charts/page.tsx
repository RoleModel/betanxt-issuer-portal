"use client";

import type { SpecPackage } from "@/components/Specs/spec-package";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/charts/affected-files";
import { CODE_SAMPLES } from "@/app/specs/charts/code-samples";
import { SPEC_META, SPEC_SECTIONS } from "@/app/specs/charts/requirements";
import { SpecPage } from "@/components/Specs/SpecPage";

/**
 * Everything that makes this package itself.
 *
 * @remarks
 * The page, the source collector, and the Markdown writer are shared with every
 * other spec, so what is left here is content and the handful of choices that
 * differ between packages. This one documents charts that already exist, so its
 * samples say whether they are as built or as built plus a proposed change, and
 * the per-sample chips stay out of the layout because each requirement already
 * names the files its sample comes from.
 */
const SPEC: SpecPackage = {
  abstract:
    "Requirements for the charts directory: every chart, what feeds it, where it renders, the control that decides whether figures read as percentages or counts, and the table and report exports that sit near the charts.",
  archive: {
    codeFolder: "reference",
    codeSummary: [
      "the code shown on the spec page, abridged from the same",
      "files under `current/`.",
    ],
    currentSummary: [
      "a sample of the app's source as it is today, grouped by",
      "what it does. It is a sample rather than the whole charts directory:",
      "nineteen chart components would bury the ideas worth reading.",
    ],
    groups: AFFECTED_GROUPS,
  },
  codeSamples: CODE_SAMPLES,
  hidesCodeChips: true,
  meta: SPEC_META,
  screenLinks: SCREEN_LINKS,
  sections: SPEC_SECTIONS,
  showsAsBuilt: true,
  slug: "charts",
};

/** Requirements package for the charts directory and the display control. */
const ChartsSpecPage = () => <SpecPage spec={SPEC} />;

export default ChartsSpecPage;
