"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useState } from "react";

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
    useState<TabulationDisplayMode>("numbers");

  return (
    <TabulationDisplayContext.Provider value={{ displayMode, setDisplayMode }}>
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
