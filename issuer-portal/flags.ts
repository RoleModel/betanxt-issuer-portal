import { vercelAdapter } from "@flags-sdk/vercel";
import { dedupe, flag } from "flags/next";
import type { ReadonlyHeaders } from "flags";

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
const identify = dedupe(
  ({ headers }: { headers: ReadonlyHeaders }): FlagEntities => {
    const ticker = headers.get("x-client-ticker");
    if (ticker === null) {
      return {};
    }
    const normalized = ticker.toUpperCase();
    return { team: { id: normalized, ticker: normalized } };
  }
);

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
  adapter: vercelAdapter(),
  defaultValue: false,
  description: "Enable NOBO features",
  identify,
  key: "enable-nobo",
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
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
export const configureDistributionFlag = flag({
  adapter: vercelAdapter(),
  defaultValue: false,
  identify,
  key: "configure-distribution",
});

export const eventStatusFlag = flag({
  adapter: vercelAdapter(),
  defaultValue: false,
  identify,
  key: "event-status",
});

export const enableTabulationTrackerColorsFlag = flag<boolean, FlagEntities>({
  adapter: vercelAdapter(),
  defaultValue: false,
  description: "Enable updated client-brand colors in the Tabulation Tracker",
  identify,
  key: "enable-tabulation-tracker-colors",
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});
