import type { ReadonlyHeaders } from "flags";

import { vercelAdapter } from "@flags-sdk/vercel";
import { dedupe, flag } from "flags/next";

/**
 * Entities used for flag targeting rules in the Vercel Flags dashboard.
 * Matches the custom `client` entity (attribute `ticker`) defined in the
 * Flags settings — rules target `client.ticker` (e.g. WEN, FOC, PAYC, ELVN).
 */
interface FlagEntities {
  client?: { ticker: string };
}

/**
 * The portal is client-rendered, so flags are evaluated through
 * `/api/feature-flags`. The browser sends the active client's ticker in the
 * `x-client-ticker` header, which becomes the `client` entity for targeting.
 */
const identify = dedupe(({ headers }: { headers: ReadonlyHeaders }): FlagEntities => {
  const ticker = headers.get("x-client-ticker");
  if (!ticker) return {};
  return { client: { ticker: ticker.toUpperCase() } };
});

/**
 * Enable NOBO (Engage) features.
 *
 * Managed in the Vercel Flags dashboard:
 * https://vercel.com/rolemodel-software/issuer-portal/flag/enable-nobo
 *
 * Targeting: rules on `client.ticker` control which issuers see Engage
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
