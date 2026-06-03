"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useReducer } from "react";

import type { components } from "@/domain-models/generated-schema";

type Phase = components["schemas"]["Phase"];
type Task = components["schemas"]["Task"];

interface PhaseState {
  currentPhase: Phase | null;
  phases: Phase[];
  tasks: Task[];
  isTransitioning: boolean;
  error: string | null;
}

type PhaseAction =
  | { type: "SET_PHASES"; payload: Phase[] }
  | { type: "SET_CURRENT_PHASE"; payload: Phase }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "START_TRANSITION" }
  | { type: "COMPLETE_TRANSITION"; payload: Phase }
  | { type: "TRANSITION_ERROR"; payload: string }
  | { type: "RESET_ERROR" };

const initialState: PhaseState = {
  currentPhase: null,
  phases: [],
  tasks: [],
  isTransitioning: false,
  error: null,
};

function phaseReducer(state: PhaseState, action: PhaseAction): PhaseState {
  switch (action.type) {
    case "SET_PHASES":
      return { ...state, phases: action.payload };

    case "SET_CURRENT_PHASE":
      return { ...state, currentPhase: action.payload };

    case "SET_TASKS":
      return { ...state, tasks: action.payload };

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? action.payload : task)),
      };

    case "START_TRANSITION":
      return { ...state, isTransitioning: true, error: null };

    case "COMPLETE_TRANSITION":
      return {
        ...state,
        currentPhase: action.payload,
        isTransitioning: false,
        error: null,
      };

    case "TRANSITION_ERROR":
      return { ...state, isTransitioning: false, error: action.payload };

    case "RESET_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

interface PhaseContextType {
  state: PhaseState;
  dispatch: React.Dispatch<PhaseAction>;
  checkPhaseCompletion: () => boolean;
  advanceToNextPhase: () => Promise<void>;
  canAdvance: boolean;
}

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

interface PhaseProviderProps {
  children: ReactNode;
  meetingId: string;
  initialPhases?: Phase[];
  initialTasks?: Task[];
}

export function PhaseProvider({
  children,
  meetingId: _meetingId,
  initialPhases = [],
  initialTasks = [],
}: PhaseProviderProps) {
  const [state, dispatch] = useReducer(phaseReducer, {
    ...initialState,
    phases: initialPhases,
    tasks: initialTasks,
  });

  // Check if all tasks in current phase are complete
  const checkPhaseCompletion = (): boolean => {
    if (!state.currentPhase) return false;

    const phaseTasks = state.tasks.filter((task) => task.phaseId === state.currentPhase?.id);

    if (phaseTasks.length === 0) return false;

    return phaseTasks.every((task) => task.status === "COMPLETE");
  };

  const canAdvance = checkPhaseCompletion();

  // Auto-advance to next phase
  const advanceToNextPhase = async (): Promise<void> => {
    if (!state.currentPhase || !canAdvance) return;

    dispatch({ type: "START_TRANSITION" });

    try {
      // Find next phase
      const currentIndex = state.phases.findIndex((p) => p.id === state.currentPhase?.id);
      const nextPhase = state.phases[currentIndex + 1];

      if (!nextPhase) {
        throw new Error("No next phase available");
      }

      // Update current phase status to COMPLETE
      await fetch(`/api/phases/${state.currentPhase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });

      // Update next phase status to IN_PROGRESS
      const response = await fetch(`/api/phases/${nextPhase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (!response.ok) {
        throw new Error("Failed to advance phase");
      }

      const updatedPhase = await response.json();

      dispatch({ type: "COMPLETE_TRANSITION", payload: updatedPhase });

      // Navigate to new phase
      if (typeof window !== "undefined") {
        const currentUrl = window.location.pathname;
        const newUrl = currentUrl.replace(/Phase%20\d+/, `Phase%20${nextPhase.orderIndex}`);
        window.location.href = newUrl;
      }
    } catch (error) {
      dispatch({
        type: "TRANSITION_ERROR",
        payload: error instanceof Error ? error.message : "Failed to advance phase",
      });
    }
  };

  // Auto-advance effect
  useEffect(() => {
    if (canAdvance && !state.isTransitioning) {
      // Auto-advance after a short delay to ensure all updates are processed
      const timer = setTimeout(() => {
        void advanceToNextPhase();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // advanceToNextPhase depends on state variables already tracked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdvance, state.isTransitioning]);

  const value: PhaseContextType = {
    state,
    dispatch,
    checkPhaseCompletion,
    advanceToNextPhase,
    canAdvance,
  };

  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>;
}

export function usePhaseContext() {
  const context = useContext(PhaseContext);
  if (context === undefined) {
    throw new Error("usePhaseContext must be used within a PhaseProvider");
  }
  return context;
}
