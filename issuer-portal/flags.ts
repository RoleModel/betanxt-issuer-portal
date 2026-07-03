import type { ReadonlyHeaders } from "flags";

import { vercelAdapter } from "@flags-sdk/vercel";
import { dedupe, flag } from "flags/next";

/**
 * Entities used for flag targeting rules in the Vercel Flags dashboard.
 * The `team` entity carries a custom `ticker` attribute (defined in the
 * Flags entity settings) — rules target `team.ticker` (e.g. WEN, FOC,
 * PAYC, ELVN).
 */
interface FlagEntities {
  team?: { id: string; ticker: string };
}

/**
 * The portal is client-rendered, so flags are evaluated through
 * `/api/feature-flags`. The browser sends the active client's ticker in the
 * `x-client-ticker` header, which becomes the `team` entity for targeting.
 */
const identify = dedupe(({ headers }: { headers: ReadonlyHeaders }): FlagEntities => {
  const ticker = headers.get("x-client-ticker");
  if (!ticker) return {};
  const normalized = ticker.toUpperCase();
  return { team: { id: normalized, ticker: normalized } };
});

/**
 * Enable NOBO (Engage) features.
 *
 * Managed in the Vercel Flags dashboard:
 * https://vercel.com/rolemodel-software/issuer-portal/flag/enable-nobo
 *
 * Targeting: rules on `team.ticker` control which issuers see Engage
 * functionality (currently WEN, FOC, PAYC, ELVN).
 */
export const enableNoboFlag = flag<boolean, FlagEntities>({
  key: "enable-nobo",
  description: "Enable NOBO features",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  identify,
  adapter: vercelAdapter(),
});

/**
 * Enable the Configure Distribution feature (automated daily tabulation
 * report delivery). Phase 2 functionality — off for the MVP.
 *
 * Managed in the Vercel Flags dashboard:
 * https://vercel.com/rolemodel-software/issuer-portal/flag/configure-distribution
 *
 * Targeting: rules on `team.ticker` control which issuers can configure
 * automated tabulation distribution.
 */
export const configureDistributionFlag = flag<boolean, FlagEntities>({
  key: "configure-distribution",
  description: "Enable the Configure Distribution feature (Phase 2)",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  identify,
  adapter: vercelAdapter(),
});
