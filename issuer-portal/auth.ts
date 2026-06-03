import type { JWT } from "next-auth/jwt";

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Defined at module level so the jwt callback can always re-read the latest
// clientTickers without requiring a fresh login — changes take effect on the
// next JWT refresh without forcing users to log out.
const mockUsers: Record<
  string,
  {
    id: string;
    username: string;
    password: string;
    type: "ISSUER" | "ADMIN" | "PARENT_CLIENT" | "SOLICITOR" | "CSM";
    account_id?: string;
    client_ticker?: string | null;
    clientTickers?: string[];
  }
> = {
  "dev.user": {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    username: "dev.user",
    password: "ju$Ky8Ad1#%g",
    type: "ADMIN",
    account_id: "d607d704-0222-5a41-abd8-552ffa17c36c",
    client_ticker: null,
  },
  "test.user": {
    id: "7d170e7c-7d1f-5ae0-ac54-c987eb45b2a9",
    username: "test.user",
    password: "9yUDDftg@Lh!",
    type: "ADMIN",
    account_id: undefined,
    client_ticker: null,
  },
  mike: {
    id: "b1f5062a-09b6-5dc1-b18c-3800c5930eab",
    username: "mike",
    password: "password",
    type: "ISSUER",
    account_id: "acc-wen-001",
    client_ticker: "WEN",
  },
  tim: {
    id: "b1f5062a-09b6-5dc1-b18c-3800c5930eab",
    username: "tim",
    password: "password",
    type: "ISSUER",
    account_id: "acc-foc-001",
    client_ticker: "FOC",
  },
  lisa: {
    id: "c2g6173b-10c7-6ed2-c29d-4911d6041fcb",
    username: "lisa",
    password: "password",
    type: "ISSUER",
    account_id: "acc-paycom-001",
    client_ticker: "PAYC",
  },
  david: {
    id: "d3h7284c-21d8-7fe3-d30e-5a22e7152gdc",
    username: "david",
    password: "password",
    type: "ISSUER",
    account_id: "acc-woodward-001",
    client_ticker: "WWD",
  },
  jenny: {
    id: "e4i8395d-32e9-8gf4-e41f-6b33f8263hed",
    username: "jenny",
    password: "password",
    type: "ISSUER",
    account_id: "acc-enliven-001",
    client_ticker: "ELVN",
  },
  "dfin.admin": {
    id: "f5a9406e-43fa-9hg5-f52g-7c44g9374ife",
    username: "dfin.admin",
    password: "DfinP@ss1",
    type: "PARENT_CLIENT",
    account_id: undefined,
    client_ticker: null,
    clientTickers: [
      "JPMR", // J.P. Morgan Real Estate Income Trust, Inc.
      "ENRS", // EnerSa
      "ETWO", // E2open Parent Holdings Inc.
      "CHH", // Champion Homes, Inc.
      "BCSF", // Bain Capital Specialty Finance, Inc.
      "STTK", // Shattuck Labs, Inc.
      "NOMD", // Nomad Foods Limited
      "QRHC", // Quest Resource Holding Corporation
      "ICU", // SeaStar Medical Holding Corporation
      "CTNM", // Contineum Therapeutics, Inc.
      "EHAB", // Enhabit, Inc.
      "FULC", // Fulcrum Therapeutics, Inc.
      "LCTX", // Lineage Cell Therapeutics, Inc.
      "INZY", // Inozyme Pharma, Inc.
      "SPRY", // ARS Pharmaceuticals Inc.
      "GOSS", // Gossamer Bio, Inc.
      "AFRM", // Affirm Holdings, Inc.
      "ALGS", // Aligos Therapeutics, Inc.
      "ELVN", // Enliven Therapeutics, Inc.
      "ERAS", // Erasca, Inc.
      "IDYA", // IDEAYA Biosciences, Inc.
      "VANI", // Vivani Medical, Inc.
      "CALC", // CalciMedica, Inc.
      "ARTV", // Artiva Biotherapeutics, Inc.
      "HLVX", // HilleVax, Inc.
      "TBIO", // Telesis Bio Inc.
      "BBIO", // Boundless Bio, Inc.
      "MDGL", // Madrigal Pharmaceuticals, Inc.
      "CBNA", // Chain Bridge Bancorp, Inc.
      "INTT", // InTest Corporation
    ],
  },
  morrow: {
    id: "g6b0517f-54gb-0ih6-g63h-8d55h0485jgf",
    username: "morrow",
    password: "MrwSdl@1",
    type: "SOLICITOR",
    account_id: undefined,
    client_ticker: null,
    clientTickers: [
      "LAC", // Lithium Americas Corp.
      "WAL", // Western Alliance Bancorporation
      "PTLO", // Portillo's Inc.
      "MDLZ", // Mondelez International, Inc.
      "DFIN", // Donnelley Financial Solutions, Inc.
      "INAB", // IN8bio, Inc.
      "TOI", // The Oncology Institute, Inc.
      "AZTR", // Azitra, Inc.
      "WWD", // Woodward, Inc.
      "VAPO", // Vapotherm, Inc.
      "SONM", // Sonim Technologies, Inc.
      "PCOR", // Procore Technologies, Inc.
      "PHX", // PHX Minerals Inc.
      "AMTB", // Amerant Bancorp Inc.
      "SQZ", // SQZ Biotechnologies Company
      "SLGC", // SomaLogic, Inc.
      "CD", // Chindata Group Holdings Ltd.
      "FREQ", // Frequency Therapeutics, Inc.
      "AMAM", // Ambrx Biopharma, Inc.
      "NEX", // NexTier Oilfield Solutions Inc.
      "ILG", // ILG Acquisition One Corp.
      "MNMD", // Mind Medicine (MindMed) Inc.
      "ADPT", // Adaptive Biotechnologies Corporation
    ],
  },
  "csm.user": {
    id: "h7c1628g-65hc-1ji7-h74i-9e66i1596kgh",
    username: "csm.user",
    password: "CsmP@ss1",
    type: "CSM",
    account_id: undefined,
    client_ticker: null,
    // Assigned portfolio for this CSM — events list defaults to these clients only
    clientTickers: [
      "WEN", // Wendy's International, Inc.
      "FOC", // FocalPoint (Wendy's clone demo)
      "PAYC", // Paycom Software, Inc.
      "WWD", // Woodward, Inc.
      "ELVN", // Enliven Therapeutics, Inc.
      "BCSF", // Bain Capital Specialty Finance, Inc.
      "CHH", // Champion Homes, Inc.
      "WAL", // Western Alliance Bancorporation
      "PHX", // PHX Minerals Inc.
    ],
  },
};

/**
 * Returns the tickers of all clients created by (assigned to) the given CSM username.
 * Reads from the `clients.created_by` column. Failures are non-fatal — returns [].
 */
async function getCreatedClientTickers(username: string): Promise<string[]> {
  try {
    const { getServerSupabase } = await import("@/lib/serverSupabase");
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("ticker")
      .eq("created_by", username);
    if (error || !data) return [];
    return data
      .map((row) => (typeof row.ticker === "string" ? row.ticker : null))
      .filter((t): t is string => Boolean(t));
  } catch {
    return [];
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true,
  secret:
    process.env.NEXTAUTH_SECRET ?? "fallback-secret-for-development-only-change-in-production",

  useSecureCookies: process.env.NODE_ENV === "production",

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      async authorize(credentials) {
        // Auth bypass for development — only triggered by bypass/bypass credentials
        if (
          process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" &&
          credentials?.username === "bypass" &&
          credentials?.password === "bypass"
        ) {
          const bypassRole = (process.env.NEXT_PUBLIC_BYPASS_USER_ROLE || "ADMIN") as
            | "ISSUER"
            | "ADMIN"
            | "PARENT_CLIENT"
            | "SOLICITOR"
            | "CSM";
          // For role-specific bypass users, delegate to the matching mock user so that
          // role-specific fields (e.g. clientTickers for CSM) are properly included.
          const roleToMockUser: Partial<Record<string, string>> = {
            CSM: "csm.user",
            PARENT_CLIENT: "dfin.admin",
            SOLICITOR: "morrow",
            ISSUER: "tim",
          };
          const delegateName = roleToMockUser[bypassRole];
          if (delegateName && mockUsers[delegateName]) {
            const m = mockUsers[delegateName];
            return {
              id: m.id,
              username: m.username,
              type: bypassRole,
              account_id: m.account_id,
              client_ticker: m.client_ticker ?? null,
              clientTickers: m.clientTickers,
            };
          }
          return {
            id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            username: "dev.user",
            type: bypassRole,
            account_id: "d607d704-0222-5a41-abd8-552ffa17c36c",
            client_ticker: null,
          };
        }

        if (!credentials?.username || !credentials?.password) return null;

        const user = mockUsers[credentials.username as string];
        if (!user) return null;
        if (credentials.password !== user.password) return null;
        return {
          id: user.id,
          username: user.username,
          type: user.type,
          account_id: user.account_id,
          client_ticker: user.client_ticker,
          clientTickers: user.clientTickers,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      try {
        if (user) {
          const customUser = user;
          token.id = customUser.id;
          token.type = customUser.type;
          token.account_id = customUser.account_id;
          token.client_ticker = customUser.client_ticker;
          token.username = customUser.username;
          token.image = undefined;
        }

        // Always re-read clientTickers from the live mockUsers config so stale
        // sessions pick up ticker list changes without requiring a re-login.
        const username = token.username;
        if (username && mockUsers[username]) {
          const mockUser = mockUsers[username];
          const baseTickers = [...(mockUser.clientTickers ?? [])];
          if (mockUser.client_ticker) {
            baseTickers.push(mockUser.client_ticker);
          }
          const createdTickers = await getCreatedClientTickers(username);
          token.clientTickers = [...new Set([...baseTickers, ...createdTickers])];
        }

        if (trigger === "update" && updateData) {
          if (updateData.image !== undefined) {
            token.image = updateData.image;
          }
        }

        return token;
      } catch {
        return token;
      }
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async session({ session, token }) {
      const t = token as JWT & {
        sub?: string;
        id?: string;
        image?: string;
        type?: string;
        account_id?: string;
        client_ticker?: string | null;
        username?: string;
        name?: string;
        email?: string;
        clientTickers?: string[];
      };
      const user = session.user;
      user.id = t.id ?? t.sub ?? "";
      user.type = t.type ?? undefined;
      user.account_id = t.account_id ?? undefined;
      user.client_ticker = t.client_ticker ?? null;
      user.username = t.username ?? undefined;
      user.image = t.image ?? null;
      user.clientTickers = t.clientTickers ?? undefined;
      user.name = t.name ?? t.username ?? session.user.name ?? "User";
      user.email = t.email ?? session.user.email ?? `${t.username ?? "user"}@example.com`;
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async redirect({ url, baseUrl }) {
      if (url === baseUrl) return baseUrl;
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
});
