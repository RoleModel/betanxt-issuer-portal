"use client";

import { useMemo, useState } from "react";

import type { ProposalRow } from "@/hooks/use-tabulation-report-review";

export interface UseProposalReviewStepperResult {
  activeStep: number;
  goToClassification: () => void;
  goToTotals: () => void;
  goToVerification: () => void;
  nonRoutineCount: number;
  originalRowsById: Map<string, ProposalRow>;
  routineCount: number;
}

/**
 * Keeps the proposal review stepper's navigation and derived proposal counts
 * outside of the presentational stepper component.
 */
export const useProposalReviewStepper = (
  rows: ProposalRow[],
  originalRows: ProposalRow[],
): UseProposalReviewStepperResult => {
  const [activeStep, setActiveStep] = useState(0);

  const routineCount = useMemo(
    () => rows.filter((row) => row.classification === "ROUTINE").length,
    [rows],
  );
  const originalRowsById = useMemo(
    () => new Map(originalRows.map((row) => [row.id, row])),
    [originalRows],
  );

  return {
    activeStep,
    goToClassification: () => {
      setActiveStep(1);
    },
    goToTotals: () => {
      setActiveStep(0);
    },
    goToVerification: () => {
      setActiveStep(2);
    },
    nonRoutineCount: rows.length - routineCount,
    originalRowsById,
    routineCount,
  };
};
