import { describe, expect, it } from "vitest";
import { advanceSpring, isSpringSettled, stepSpring, type SpringConfig, type SpringState } from "./spring";

const soft: SpringConfig = { stiffness: 170, damping: 13 };

function run(start: SpringState, target: number, seconds: number, config = soft): SpringState {
  let state = start;
  for (let t = 0; t < seconds; t += 1 / 60) state = stepSpring(state, target, config, 1 / 60);
  return state;
}

describe("stepSpring", () => {
  it("stays put at its target", () => {
    expect(stepSpring({ value: 2, velocity: 0 }, 2, soft, 1 / 60)).toEqual({ value: 2, velocity: 0 });
  });

  it("converges to the target and comes to rest", () => {
    const end = run({ value: 0, velocity: 0 }, 1, 3);

    expect(end.value).toBeCloseTo(1, 3);
    expect(Math.abs(end.velocity)).toBeLessThan(1e-3);
  });

  it("overshoots when under-damped", () => {
    let peak = 0;
    let state: SpringState = { value: 0, velocity: 0 };
    for (let i = 0; i < 120; i++) {
      state = stepSpring(state, 1, soft, 1 / 60);
      peak = Math.max(peak, state.value);
    }

    expect(peak).toBeGreaterThan(1);
  });

  it("does not overshoot when critically damped", () => {
    const critical: SpringConfig = { stiffness: 100, damping: 20 };
    let peak = 0;
    let state: SpringState = { value: 0, velocity: 0 };
    for (let i = 0; i < 240; i++) {
      state = stepSpring(state, 1, critical, 1 / 60);
      peak = Math.max(peak, state.value);
    }

    expect(peak).toBeLessThanOrEqual(1.001);
  });

  it("clamps long frames so the simulation stays stable", () => {
    const long = stepSpring({ value: 0, velocity: 0 }, 1, soft, 5);
    const clamped = stepSpring({ value: 0, velocity: 0 }, 1, soft, 1 / 30);

    expect(long).toEqual(clamped);
  });

  it("ignores non-positive time steps", () => {
    const start: SpringState = { value: 0.3, velocity: 2 };

    expect(stepSpring(start, 1, soft, 0)).toEqual(start);
    expect(stepSpring(start, 1, soft, -1)).toEqual(start);
  });

  it("does not mutate its input", () => {
    const start: SpringState = { value: 0, velocity: 0 };

    stepSpring(start, 1, soft, 1 / 60);

    expect(start).toEqual({ value: 0, velocity: 0 });
  });
});

describe("advanceSpring", () => {
  it("matches stepSpring while mutating in place", () => {
    const state = { value: 0.2, velocity: 1 };
    let pure: SpringState = { ...state };

    for (let i = 0; i < 100; i++) {
      pure = stepSpring(pure, 1, soft, 1 / 60);
      advanceSpring(state, 1, soft, 1 / 60);
    }

    expect(state).toEqual(pure);
  });
});

describe("isSpringSettled", () => {
  it("is settled when at the target and not moving", () => {
    expect(isSpringSettled({ value: 1, velocity: 0 }, 1)).toBe(true);
    expect(isSpringSettled({ value: 1.0004, velocity: 0.0004 }, 1)).toBe(true);
  });

  it("is unsettled while displaced or moving", () => {
    expect(isSpringSettled({ value: 0.9, velocity: 0 }, 1)).toBe(false);
    expect(isSpringSettled({ value: 1, velocity: 0.5 }, 1)).toBe(false);
  });
});
