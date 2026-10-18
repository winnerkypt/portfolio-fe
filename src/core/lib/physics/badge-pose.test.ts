import { describe, expect, it } from "vitest";
import { badgePose, flip, initialSpin, isTap, stepSpin } from "./badge-pose";

const FRAME = 1 / 60;

function run(spin: ReturnType<typeof initialSpin>, frames: number, vx = 0) {
  let next = spin;
  for (let i = 0; i < frames; i++) next = stepSpin(next, vx, FRAME, false);
  return next;
}

describe("badgePose", () => {
  it("hangs the card straight below a vertical rope", () => {
    const pose = badgePose([0, 1, 0], [0, 1.05, 0], { clip: 0.05, card: 1.2 });

    expect(pose.angleZ).toBeCloseTo(0);
    expect(pose.clip[1]).toBeCloseTo(0.95);
    expect(pose.card[1]).toBeCloseTo(-0.2);
    expect(pose.card[0]).toBeCloseTo(0);
  });

  it("tilts the card along a diagonal rope and offsets it in the rope direction", () => {
    const pose = badgePose([1, 0, 0], [0, 1, 0], { clip: 0.05, card: 1 });

    expect(pose.angleZ).toBeCloseTo(Math.PI / 4);
    expect(pose.card[0]).toBeCloseTo(1 + Math.SQRT1_2);
    expect(pose.card[1]).toBeCloseTo(-Math.SQRT1_2);
  });
});

describe("spin", () => {
  it("starts with a gentle nudge unless motion is reduced", () => {
    expect(initialSpin(false).velocity).toBeGreaterThan(0);
    expect(initialSpin(true).velocity).toBe(0);
  });

  it("eases a flip to a half turn and settles there", () => {
    const flipped = flip(initialSpin(true));

    const settled = run(flipped, 600);

    expect(flipped.target).toBeCloseTo(Math.PI);
    expect(settled.angle).toBeCloseTo(Math.PI, 2);
    expect(Math.abs(settled.velocity)).toBeLessThan(1e-3);
  });

  it("toggles back with a second flip", () => {
    const settled = run(flip(flip(initialSpin(true))), 800);

    expect(settled.angle).toBeCloseTo(2 * Math.PI, 2);
  });

  it("lets sideways swing add spin only when motion is allowed", () => {
    const base = { angle: 0, velocity: 0, target: 0 };

    expect(stepSpin(base, 0.1, FRAME, false).velocity).toBeGreaterThan(0);
    expect(stepSpin(base, 0.1, FRAME, true).velocity).toBe(0);
  });

  it("ignores negative frame times from out-of-order rAF timestamps", () => {
    const spin = stepSpin({ angle: 1, velocity: 0.2, target: 0 }, 0, -0.5, false);

    expect(Number.isFinite(spin.velocity)).toBe(true);
    expect(Math.abs(spin.velocity)).toBeLessThanOrEqual(0.2);
    expect(spin.angle).toBe(1);
  });

  it("does not return the input state", () => {
    const base = initialSpin(false);

    expect(stepSpin(base, 0, FRAME, false)).not.toBe(base);
    expect(base.angle).toBe(0);
  });
});

describe("isTap", () => {
  it("accepts a short, nearly still press", () => {
    expect(isTap({ x: 10, y: 10, t: 0 }, { x: 12, y: 11, t: 200 })).toBe(true);
  });

  it("rejects a drag or a long press", () => {
    expect(isTap({ x: 10, y: 10, t: 0 }, { x: 40, y: 10, t: 100 })).toBe(false);
    expect(isTap({ x: 10, y: 10, t: 0 }, { x: 10, y: 10, t: 500 })).toBe(false);
  });
});
