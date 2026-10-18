import { describe, expect, it } from "vitest";
import { clampReach, createRope, pinTip, ropeEnergy, stepRope, type RopeOptions, type RopeState, type Vec3 } from "./rope";

const SEG = 0.045;
const COUNT = 12;
const anchor: Vec3 = [1.5, 2, 0];

const options: RopeOptions = {
  anchor,
  segment: SEG,
  gravity: -16,
  damping: 0.975,
  iterations: 16,
  wind: 0,
  tipPinned: false,
};

function simulate(state: RopeState, steps: number, dt: number, opts: RopeOptions = options): RopeState {
  let next = state;
  for (let i = 0; i < steps; i++) next = stepRope(next, dt, opts);
  return next;
}

function segmentLengths(state: RopeState): number[] {
  return state.positions.slice(1).map((p, i) => {
    const q = state.positions[i];
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  });
}

function displaced(): RopeState {
  const rope = createRope(anchor, COUNT, SEG);
  return {
    positions: rope.positions.map((p, i) => (i === 0 ? p : ([p[0] + 0.3, p[1], p[2]] as Vec3))),
    previous: rope.positions.map((p, i) => (i === 0 ? p : ([p[0] + 0.3, p[1], p[2]] as Vec3))),
  };
}

describe("createRope", () => {
  it("hangs straight down from the anchor", () => {
    const rope = createRope(anchor, COUNT, SEG);

    expect(rope.positions).toHaveLength(COUNT);
    expect(rope.positions[0]).toEqual(anchor);
    expect(rope.positions[1][0]).toBe(anchor[0]);
    expect(rope.positions[1][1]).toBeLessThan(anchor[1]);
    expect(rope.previous).toEqual(rope.positions);
  });
});

describe("stepRope", () => {
  it("keeps the first point pinned to the anchor", () => {
    const after = simulate(displaced(), 120, 1 / 60);

    expect(after.positions[0]).toEqual(anchor);
  });

  it("does not mutate the state it was given", () => {
    const rope = displaced();
    const snapshot = JSON.stringify(rope);

    stepRope(rope, 1 / 60, options);

    expect(JSON.stringify(rope)).toBe(snapshot);
  });

  it("converges every segment to the rest length", () => {
    const after = simulate(displaced(), 240, 1 / 60);

    for (const length of segmentLengths(after)) {
      expect(Math.abs(length - SEG)).toBeLessThan(SEG * 0.1);
    }
  });

  it("settles hanging below the anchor with damping", () => {
    const start = displaced();
    const early = simulate(start, 20, 1 / 60);
    const late = simulate(early, 600, 1 / 60);

    expect(ropeEnergy(late)).toBeLessThan(ropeEnergy(early));
    expect(ropeEnergy(late)).toBeLessThan(1e-4);
    const tip = late.positions[COUNT - 1];
    expect(tip[1]).toBeLessThan(anchor[1]);
    expect(Math.abs(tip[0] - anchor[0])).toBeLessThan(0.05);
  });

  it("stays finite when dt spikes", () => {
    const after = simulate(displaced(), 5, 5);

    for (const p of after.positions) {
      expect(p.every(Number.isFinite)).toBe(true);
    }
    expect(Math.max(...segmentLengths(after))).toBeLessThan(SEG * 3);
  });

  it("applies wind as a sideways push", () => {
    const calm = simulate(createRope(anchor, COUNT, SEG), 30, 1 / 60);
    const windy = simulate(createRope(anchor, COUNT, SEG), 30, 1 / 60, { ...options, wind: 40 });

    expect(windy.positions[COUNT - 1][0]).toBeGreaterThan(calm.positions[COUNT - 1][0]);
  });

  it("leaves a pinned tip where the pointer put it", () => {
    const target: Vec3 = [anchor[0] + 0.2, anchor[1] - 0.4, 0];
    const held = pinTip(createRope(anchor, COUNT, SEG), target);

    const after = simulate(held, 60, 1 / 60, { ...options, tipPinned: true });

    expect(after.positions[COUNT - 1]).toEqual(target);
  });
});

describe("pinTip", () => {
  it("moves the tip and remembers where it was", () => {
    const rope = createRope(anchor, COUNT, SEG);
    const before = rope.positions[COUNT - 1];

    const moved = pinTip(rope, [0, 0, 0]);

    expect(moved.positions[COUNT - 1]).toEqual([0, 0, 0]);
    expect(moved.previous[COUNT - 1]).toEqual(before);
    expect(rope.positions[COUNT - 1]).toEqual(before);
  });
});

describe("clampReach", () => {
  it("leaves targets within reach untouched", () => {
    const target: Vec3 = [1.6, 1.9, 0];

    expect(clampReach(anchor, target, 1)).toBe(target);
  });

  it("pulls far targets back onto the reach sphere along the same direction", () => {
    const clamped = clampReach(anchor, [anchor[0] + 3, anchor[1] + 4, 0], 1);

    expect(Math.hypot(clamped[0] - anchor[0], clamped[1] - anchor[1])).toBeCloseTo(1);
    expect(clamped[0] - anchor[0]).toBeCloseTo(0.6);
    expect(clamped[1] - anchor[1]).toBeCloseTo(0.8);
  });
});
