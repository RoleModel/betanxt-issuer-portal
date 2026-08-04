"use client";

import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface PhaseDrawerContextType {
  isOpen: boolean;
  drawerOpen: boolean;
  currentPhase: number | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setPhase: (phase: number) => void;
  onTaskClick: (taskId: string) => void;
}

const PhaseDrawerContext = createContext<PhaseDrawerContextType | undefined>(
  undefined
);

export const usePhaseDrawer = (): PhaseDrawerContextType => {
  const context = useContext(PhaseDrawerContext);
  if (!context) {
    throw new Error("usePhaseDrawer must be used within a PhaseDrawerProvider");
  }
  return context;
};

interface PhaseDrawerProviderProps {
  readonly children: ReactNode;
}

const onTaskClick = (_taskId: string): void => {
  // Handle task click logic here
};

export const PhaseDrawerProvider: React.FC<PhaseDrawerProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);

  const openDrawer = useCallback((): void => {
    setIsOpen(true);
  }, []);
  const closeDrawer = useCallback((): void => {
    setIsOpen(false);
  }, []);
  const toggleDrawer = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);
  const setPhase = useCallback((phase: number): void => {
    setCurrentPhase(phase);
  }, []);

  const value = useMemo<PhaseDrawerContextType>(
    () => ({
      isOpen,
      drawerOpen: isOpen,
      currentPhase,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      setPhase,
      onTaskClick,
    }),
    [isOpen, currentPhase, openDrawer, closeDrawer, toggleDrawer, setPhase]
  );

  return (
    <PhaseDrawerContext.Provider value={value}>
      {children}
    </PhaseDrawerContext.Provider>
  );
};
