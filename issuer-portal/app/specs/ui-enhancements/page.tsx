"use client";

import type { SpecPackage } from "@/components/Specs/spec-package";

import {
  AFFECTED_GROUPS,
  SCREEN_LINKS,
} from "@/app/specs/ui-enhancements/affected-files";
import { CODE_SAMPLES } from "@/app/specs/ui-enhancements/code-samples";
import {
  SPEC_META,
  SPEC_SECTIONS,
} from "@/app/specs/ui-enhancements/requirements";
import { SpecPage } from "@/components/Specs/SpecPage";

/**
 * Everything that makes this package itself.
 *
 * @remarks
 * The page, the source collector, and the Markdown writer are shared with every
 * other spec, so what is left here is content and the handful of choices that
 * differ between packages. This one's samples are proposals rather than
 * shipping code, so they land in `proposed/` and the README says so.
 */
const SPEC: SpecPackage = {
  abstract:
    "Requirements for three UI enhancements: a percentage/count display toggle, tooltip and glossary navigation, and glossary formatting.",
  archive: {
    codeFolder: "proposed",
    currentSummary: [
      "a sample of the app's source as it is today, grouped by",
      "what it does. One file per idea rather than every file the work touches:",
      "the rest follow the same patterns and are named under each requirement's",
      '"In the code" on the spec page.',
    ],
    groups: AFFECTED_GROUPS,
    pathNote: [
      "Paths under `current/` mirror `issuer-portal/`, so a file at",
      "`current/glossary/components/ui/GlossaryText.tsx` lives at",
      "`issuer-portal/components/ui/GlossaryText.tsx`.",
    ],
  },
  codeSamples: CODE_SAMPLES,
  meta: SPEC_META,
  screenLinks: SCREEN_LINKS,
  sections: SPEC_SECTIONS,
  slug: "ui-enhancements",
};

/** Requirements package for the three requested UI enhancements. */
const UiEnhancementSpecPage = () => <SpecPage spec={SPEC} />;

export default UiEnhancementSpecPage;
