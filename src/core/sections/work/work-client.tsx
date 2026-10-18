"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { Project } from "@/core/data/types/project";
import { SWAP_MS, caseReducer, createCaseState, shouldAutoscroll } from "@/core/lib/case-state";
import { prefersReducedMotion } from "@/core/lib/motion";
import { CaseSelectionContext } from "./case-selection";
import { CaseSpread } from "./case-spread";
import { FileIndex } from "./file-index";

const pad = (n: number): string => String(n).padStart(2, "0");

function announcement(projects: readonly Project[], index: number): string {
  return `Case ${pad(index + 1)} of ${pad(projects.length)}: ${projects[index].name}`;
}

interface WorkClientProps {
  readonly projects: readonly Project[];
  readonly children?: ReactNode;
}

interface WorkFootProps {
  readonly projects: readonly Project[];
  readonly activeIndex: number;
  readonly onSelect: (index: number) => void;
  readonly onStep: (delta: 1 | -1) => void;
}

function WorkFoot({ projects, activeIndex, onSelect, onStep }: WorkFootProps) {
  return (
    <div className="work-foot">
      <button className="step-btn" type="button" aria-label="Previous project" onClick={() => onStep(-1)}>
        &#8592;
      </button>
      <FileIndex projects={projects} activeIndex={activeIndex} onSelect={onSelect} />
      <button className="step-btn" type="button" aria-label="Next project" onClick={() => onStep(1)}>
        &#8594;
      </button>
    </div>
  );
}

export function WorkClient({ projects, children }: WorkClientProps) {
  const [state, dispatch] = useReducer(caseReducer, projects.length, createCaseState);
  const spreadRef = useRef<HTMLDivElement>(null);

  const select = useCallback(
    (index: number) => dispatch({ type: "select", index, instant: prefersReducedMotion() }),
    [],
  );
  const step = useCallback(
    (delta: 1 | -1) => dispatch({ type: "step", delta, instant: prefersReducedMotion() }),
    [],
  );
  const selection = useMemo(() => ({ index: state.index, select }), [state.index, select]);

  useEffect(() => {
    if (state.phase !== "out") return;
    const timer = setTimeout(() => dispatch({ type: "swapped" }), SWAP_MS);
    return () => clearTimeout(timer);
  }, [state.phase, state.pings]);

  useEffect(() => {
    const spread = spreadRef.current;
    if (state.pings === 0 || !spread) return;
    const { top, bottom } = spread.getBoundingClientRect();
    if (!shouldAutoscroll(top, bottom, window.innerHeight)) return;
    spread.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth", block: "nearest" });
  }, [state.pings]);

  return (
    <CaseSelectionContext.Provider value={selection}>
      {children}
      <WorkFoot projects={projects} activeIndex={state.index} onSelect={select} onStep={step} />
      <p className="sr-only" role="status">
        {state.pings > 0 ? announcement(projects, state.index) : ""}
      </p>
      <CaseSpread
        ref={spreadRef}
        project={projects[state.shown]}
        index={state.shown}
        total={projects.length}
        phase={state.phase}
        pings={state.pings}
      />
    </CaseSelectionContext.Provider>
  );
}
