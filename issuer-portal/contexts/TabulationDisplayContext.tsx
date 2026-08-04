"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useMemo, useState } from "react";

import type { TabulationDisplayMode } from "@/utils/tabulation-display";

interface TabulationDisplayContextValue {
  readonly displayMode: TabulationDisplayMode;
  readonly setDisplayMode: (displayMode: TabulationDisplayMode) => void;
}

const TabulationDisplayContext =
  createContext<TabulationDisplayContextValue | null>(null);

export const TabulationDisplayProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [displayMode, setDisplayMode] =
    useState<TabulationDisplayMode>("percentages");

  // React Compiler is deliberately not enabled (see issuer-portal/next.config.ts),
  // so this memo is load-bearing for context consumer stability.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- see comment above
  const value = useMemo<TabulationDisplayContextValue>(
    () => ({ displayMode, setDisplayMode }),
    [displayMode]
  );

  return (
    <TabulationDisplayContext.Provider value={value}>
      {children}
    </TabulationDisplayContext.Provider>
  );
};

export const useTabulationDisplay = (): TabulationDisplayContextValue => {
  const context = useContext(TabulationDisplayContext);

  if (context === null) {
    throw new Error(
      "useTabulationDisplay must be used within a TabulationDisplayProvider"
    );
  }

  return context;
};
