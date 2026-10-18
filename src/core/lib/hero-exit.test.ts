import { describe, expect, it } from "vitest";
import { heroExitProgress } from "./hero-exit";

describe("heroExitProgress", () => {
  it("is 0 at the top of the page", () => {
    expect(heroExitProgress(0, 0, 800, 76)).toBe(0);
  });

  it("is 1 once the hero bottom reaches the nav bottom", () => {
    expect(heroExitProgress(724, 0, 800, 76)).toBe(1);
  });

  it("interpolates linearly in between", () => {
    expect(heroExitProgress(362, 0, 800, 76)).toBeCloseTo(0.5, 5);
  });

  it("clamps overscroll above and below", () => {
    expect(heroExitProgress(-120, 0, 800, 76)).toBe(0);
    expect(heroExitProgress(5000, 0, 800, 76)).toBe(1);
  });

  it("waits for the hero to start when it sits below the page top", () => {
    expect(heroExitProgress(100, 200, 800, 76)).toBe(0);
    expect(heroExitProgress(200 + 724, 200, 800, 76)).toBe(1);
  });

  it("returns 0 for degenerate heights instead of NaN", () => {
    expect(heroExitProgress(50, 0, 0, 76)).toBe(0);
    expect(heroExitProgress(50, 0, 76, 76)).toBe(0);
    expect(heroExitProgress(Number.NaN, 0, 800, 76)).toBe(0);
  });
});
