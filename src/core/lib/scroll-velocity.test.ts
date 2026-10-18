import { describe, expect, it } from "vitest";
import { smoothVelocity } from "./scroll-velocity";

describe("smoothVelocity", () => {
  it("moves toward the instant velocity without overshooting", () => {
    const next = smoothVelocity(0, 1000, 16);

    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(1000);
  });

  it("converges on a steady scroll speed", () => {
    let v = 0;
    for (let i = 0; i < 60; i++) v = smoothVelocity(v, 800, 16);

    expect(v).toBeCloseTo(800, 0);
  });

  it("decays toward zero and snaps to exactly zero when scrolling stops", () => {
    let v = 2000;
    for (let i = 0; i < 120; i++) v = smoothVelocity(v, 0, 16);

    expect(v).toBe(0);
  });

  it("keeps the sign of the scroll direction", () => {
    expect(smoothVelocity(0, -900, 16)).toBeLessThan(0);
  });

  it("is frame-rate independent", () => {
    let fast = 0;
    for (let i = 0; i < 12; i++) fast = smoothVelocity(fast, 1000, 8);
    let slow = 0;
    for (let i = 0; i < 6; i++) slow = smoothVelocity(slow, 1000, 16);

    expect(fast).toBeCloseTo(slow, 3);
  });

  it("ignores non-finite input and non-positive dt", () => {
    expect(smoothVelocity(100, Number.NaN, 16)).toBe(100);
    expect(smoothVelocity(100, 500, 0)).toBe(100);
    expect(smoothVelocity(100, 500, -5)).toBe(100);
  });
});
