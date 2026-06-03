import "next-auth";

interface Client {
  id: number;
  name: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      type?: string;
      accountId?: string;
      account_id?: string;
      client_ticker?: string | null;
      client?: Client | null;
      roles?: string[];
      /** Tickers of clients this user is allowed to access (PARENT_CLIENT users) */
      clientTickers?: string[];
    };
  }

  interface User {
    id?: string;
    username?: string;
    type?: string;
    accountId?: string;
    account_id?: string;
    client_ticker?: string | null;
    client?: Client | null;
    roles?: string[];
    clientTickers?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    type?: string;
    accountId?: string;
    account_id?: string;
    client_ticker?: string | null;
    client?: Client | null;
    roles?: string[];
    image?: string | null;
    clientTickers?: string[];
  }
}
