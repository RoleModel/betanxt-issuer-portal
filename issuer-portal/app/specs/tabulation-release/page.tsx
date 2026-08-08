"use client";

import type { SpecPackage } from "@/components/Specs/spec-package";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/tabulation-release/affected-files";
import { CODE_SAMPLES } from "@/app/specs/tabulation-release/code-samples";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/tabulation-release/requirements";
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
    "Requirements for the CSM-controlled release of tabulation results: the release action itself, and what every tabulation surface shows while results are withheld.",
  archive: { codeFolder: "reference", groups: AFFECTED_GROUPS },
  codeSamples: CODE_SAMPLES,
  meta: SPEC_META,
  screenLinks: SCREEN_LINKS,
  sections: SPEC_SECTIONS,
  slug: "tabulation-release",
};

/** Requirements package for the CSM tabulation release. */
const TabulationReleaseSpecPage = () => <SpecPage spec={SPEC} />;

export default TabulationReleaseSpecPage;
