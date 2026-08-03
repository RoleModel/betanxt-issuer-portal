"use client";

import type { PropsWithChildren } from "react";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { InfoDialog } from "@/components/InfoDialog";
import { termsDefinitions } from "@/lib/termsDefinitions";

/** Every term the glossary knows about, keyed by its definition id. */
export type GlossaryTermId = keyof typeof termsDefinitions;

interface GlossaryContextValue {
  readonly closeGlossary: () => void;
  readonly isOpen: boolean;
  /**
   * Opens the glossary drawer, selecting `termId` when one is given.
   *
   * @param termId - Term to land on. Omit to open at the first entry, which is
   * what the support speed dial does.
   */
  readonly openGlossary: (termId?: GlossaryTermId) => void;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

/**
 * Reads the glossary controls.
 *
 * @returns The open/close handlers shared by every glossary entry point.
 * @throws When called outside {@link GlossaryProvider}.
 */
export const useGlossary = (): GlossaryContextValue => {
  const context = useContext(GlossaryContext);

  if (context === null) {
    throw new Error("useGlossary must be used within a GlossaryProvider");
  }

  return context;
};

/**
 * Owns the single glossary drawer and the term it is showing.
 *
 * @remarks
 * The drawer is mounted here rather than at each call site so that an inline
 * term marker anywhere in the tree opens the same instance — the component only
 * has to name a term, not carry a dialog with it.
 */
export const GlossaryProvider = ({ children }: PropsWithChildren) => {
  const [openTermId, setOpenTermId] = useState<GlossaryTermId | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openGlossary = useCallback((termId?: GlossaryTermId): void => {
    setOpenTermId(termId ?? null);
    setIsOpen(true);
  }, []);

  const closeGlossary = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const value = useMemo<GlossaryContextValue>(
    () => ({ closeGlossary, isOpen, openGlossary }),
    [closeGlossary, isOpen, openGlossary]
  );

  const selectedEntry =
    openTermId === null ? undefined : termsDefinitions[openTermId];

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <InfoDialog
        definition={selectedEntry?.definition ?? ""}
        onClose={closeGlossary}
        open={isOpen}
        term={selectedEntry?.term ?? ""}
      />
    </GlossaryContext.Provider>
  );
};
