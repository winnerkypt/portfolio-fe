"use client";

import { createContext, useContext } from "react";

export interface CaseSelection {
  readonly index: number;
  readonly select: (index: number) => void;
}

export const CaseSelectionContext = createContext<CaseSelection | null>(null);

export function useCaseSelection(): CaseSelection {
  const value = useContext(CaseSelectionContext);
  if (!value) throw new Error("useCaseSelection must be used inside WorkClient");
  return value;
}
