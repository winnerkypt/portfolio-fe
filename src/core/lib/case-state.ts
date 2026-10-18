export const SWAP_MS = 220;

export type CasePhase = "in" | "out";

export interface CaseState {
  readonly total: number;
  readonly index: number;
  readonly shown: number;
  readonly phase: CasePhase;
  readonly pings: number;
}

export type CaseAction =
  | { readonly type: "select"; readonly index: number; readonly instant?: boolean }
  | { readonly type: "step"; readonly delta: 1 | -1; readonly instant?: boolean }
  | { readonly type: "swapped" };

export function createCaseState(total: number): CaseState {
  return { total, index: 0, shown: 0, phase: "in", pings: 0 };
}

function moveTo(state: CaseState, index: number, instant: boolean): CaseState {
  if (!Number.isInteger(index) || index < 0 || index >= state.total || index === state.index) return state;
  return {
    ...state,
    index,
    shown: instant ? index : state.shown,
    phase: instant ? "in" : "out",
    pings: state.pings + 1,
  };
}

export function caseReducer(state: CaseState, action: CaseAction): CaseState {
  switch (action.type) {
    case "select":
      return moveTo(state, action.index, action.instant === true);
    case "step":
      return moveTo(state, (state.index + action.delta + state.total) % state.total, action.instant === true);
    case "swapped":
      return state.phase === "out" ? { ...state, shown: state.index, phase: "in" } : state;
  }
}

export function shouldAutoscroll(rectTop: number, rectBottom: number, viewportH: number, margin = 140): boolean {
  return rectTop > viewportH - margin || rectBottom < margin;
}
