import { describe, expect, it } from "vitest";
import { SWAP_MS, caseReducer, createCaseState, shouldAutoscroll } from "./case-state";

const start = createCaseState(5);

describe("caseReducer", () => {
  it("starts settled on the first project", () => {
    expect(start).toMatchObject({ index: 0, shown: 0, phase: "in", pings: 0, total: 5 });
  });

  it("select moves the index, starts the out phase and pings", () => {
    const next = caseReducer(start, { type: "select", index: 2 });
    expect(next).toMatchObject({ index: 2, shown: 0, phase: "out", pings: 1 });
  });

  it("swapped completes the transition", () => {
    const out = caseReducer(start, { type: "select", index: 2 });
    expect(caseReducer(out, { type: "swapped" })).toMatchObject({ index: 2, shown: 2, phase: "in" });
  });

  it("swapped is a no-op when already settled", () => {
    expect(caseReducer(start, { type: "swapped" })).toBe(start);
  });

  it("select is instant under reduced motion", () => {
    const next = caseReducer(start, { type: "select", index: 3, instant: true });
    expect(next).toMatchObject({ index: 3, shown: 3, phase: "in", pings: 1 });
  });

  it("ignores selecting the current or an invalid index", () => {
    expect(caseReducer(start, { type: "select", index: 0 })).toBe(start);
    expect(caseReducer(start, { type: "select", index: 5 })).toBe(start);
    expect(caseReducer(start, { type: "select", index: -1 })).toBe(start);
    expect(caseReducer(start, { type: "select", index: 1.5 })).toBe(start);
  });

  it("step moves forward and wraps from last to first", () => {
    const last = caseReducer(start, { type: "select", index: 4, instant: true });
    expect(caseReducer(start, { type: "step", delta: 1 }).index).toBe(1);
    expect(caseReducer(last, { type: "step", delta: 1 }).index).toBe(0);
  });

  it("step moves back and wraps from first to last", () => {
    expect(caseReducer(start, { type: "step", delta: -1 }).index).toBe(4);
  });

  it("step passes the instant flag through", () => {
    expect(caseReducer(start, { type: "step", delta: 1, instant: true })).toMatchObject({ shown: 1, phase: "in" });
  });

  it("does not mutate the previous state", () => {
    const frozen = Object.freeze({ ...start });
    expect(() => caseReducer(frozen, { type: "select", index: 1 })).not.toThrow();
  });

  it("swaps after 220ms", () => {
    expect(SWAP_MS).toBe(220);
  });
});

describe("shouldAutoscroll", () => {
  it("is false when the spread is comfortably visible", () => {
    expect(shouldAutoscroll(200, 900, 800)).toBe(false);
  });

  it("is true when the top is below the viewport minus the margin", () => {
    expect(shouldAutoscroll(661, 1400, 800)).toBe(true);
    expect(shouldAutoscroll(660, 1400, 800)).toBe(false);
  });

  it("is true when the spread is scrolled above the viewport", () => {
    expect(shouldAutoscroll(-900, 100, 800)).toBe(true);
  });

  it("honours a custom margin", () => {
    expect(shouldAutoscroll(700, 1400, 800)).toBe(true);
    expect(shouldAutoscroll(700, 1400, 800, 50)).toBe(false);
  });
});
