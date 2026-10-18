import { describe, expect, it } from "vitest";
import { createRope, pinTip, stepRope, type RopeOptions, type RopeState, type Vec3 } from "./rope";
import { buffersFromState, createRopeBuffers, kickInPlace, pinTipInPlace, stateFromBuffers, stepRopeInPlace } from "./rope-inplace";

const anchor: Vec3 = [1.5, 2, 0];
const base: RopeOptions = { anchor, segment: 0.045, gravity: -16, damping: 0.975, iterations: 16, wind: 0.1, tipPinned: false };

function disturbed(): RopeState {
  const rope = createRope(anchor, 12, 0.045);
  return pinTip({ ...rope, positions: rope.positions.map((p, i): Vec3 => (i ? [p[0] + 0.2, p[1], p[2] + 0.05] : p)) }, [2.2, 1.7, 0.1]);
}

describe("createRopeBuffers", () => {
  it("matches createRope", () => {
    const state = stateFromBuffers(createRopeBuffers(anchor, 12, 0.045));

    expect(state).toEqual(createRope(anchor, 12, 0.045));
  });
});

describe("stepRopeInPlace", () => {
  it.each([false, true])("matches stepRope exactly over many steps (tipPinned=%s)", (tipPinned) => {
    const options = { ...base, tipPinned };
    let pure = disturbed();
    const buffers = buffersFromState(pure);

    for (let i = 0; i < 90; i++) {
      pure = stepRope(pure, 1 / 180, options);
      stepRopeInPlace(buffers, 1 / 180, options);
    }

    expect(stateFromBuffers(buffers)).toEqual(pure);
  });

  it("clamps oversize time steps like stepRope", () => {
    const pure = stepRope(disturbed(), 5, base);
    const buffers = buffersFromState(disturbed());

    stepRopeInPlace(buffers, 5, base);

    expect(stateFromBuffers(buffers)).toEqual(pure);
  });

  it("does not replace its typed arrays", () => {
    const buffers = buffersFromState(disturbed());
    const { positions, previous } = buffers;

    stepRopeInPlace(buffers, 1 / 60, base);

    expect(buffers.positions).toBe(positions);
    expect(buffers.previous).toBe(previous);
  });
});

describe("pinTipInPlace", () => {
  it("matches pinTip", () => {
    const state = disturbed();
    const buffers = buffersFromState(state);

    pinTipInPlace(buffers, [0.4, 0.5, 0.6]);

    expect(stateFromBuffers(buffers)).toEqual(pinTip(state, [0.4, 0.5, 0.6]));
  });
});

describe("kickInPlace", () => {
  it("adds velocity that grows toward the tip and never moves the anchor", () => {
    const buffers = createRopeBuffers(anchor, 12, 0.045);
    const before = buffers.previous.slice();

    kickInPlace(buffers, 0.01, -0.02);

    const velocityX = (i: number): number => buffers.positions[i * 3] - buffers.previous[i * 3];
    expect(buffers.previous.slice(0, 3)).toEqual(before.slice(0, 3));
    expect(velocityX(5)).toBeGreaterThan(0);
    expect(velocityX(11)).toBeCloseTo(0.01, 10);
    expect(velocityX(11)).toBeGreaterThan(velocityX(5));
    expect(buffers.positions[11 * 3 + 1] - buffers.previous[11 * 3 + 1]).toBeCloseTo(-0.02, 10);
  });
});
