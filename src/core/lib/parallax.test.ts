import { describe, expect, it } from "vitest";
import { parallaxOffset, quantise } from "./parallax";

describe("parallaxOffset", () => {
  it("is zero when the element centre sits at the viewport centre", () => {
    expect(parallaxOffset(1450, 1000, 900, 0.1)).toBe(0);
  });

  it("lags behind the scroll: an element above centre is pushed down", () => {
    expect(parallaxOffset(1300, 1000, 900, 0.1)).toBeGreaterThan(14);
    expect(parallaxOffset(1300, 1000, 900, 0.1)).toBeLessThan(15);
  });

  it("pulls an element below centre up, symmetrically", () => {
    expect(parallaxOffset(1600, 1000, 900, 0.1)).toBeCloseTo(-parallaxOffset(1300, 1000, 900, 0.1));
  });

  it("flips direction for a negative speed", () => {
    expect(parallaxOffset(1300, 1000, 900, -0.1)).toBeCloseTo(-parallaxOffset(1300, 1000, 900, 0.1));
  });

  it("is near-linear for small offsets", () => {
    expect(parallaxOffset(1300, 1000, 900, 0.05)).toBeCloseTo(7.5, 0);
  });

  it("eases toward maxPx instead of stopping dead at it", () => {
    const near = parallaxOffset(0, 1000, 900, 0.1);
    const far = parallaxOffset(0, 2000, 900, 0.1);

    expect(near).toBeLessThan(40);
    expect(far).toBeGreaterThan(near);
    expect(far).toBeLessThan(40);
  });

  it("never exceeds maxPx in either direction", () => {
    expect(parallaxOffset(0, 5000, 900, 0.5)).toBeLessThanOrEqual(40);
    expect(parallaxOffset(9000, 0, 900, 0.5)).toBeGreaterThanOrEqual(-40);
    expect(parallaxOffset(0, 5000, 900, 0.5, 12)).toBeLessThanOrEqual(12);
  });

  it("returns 0 for non-finite input", () => {
    expect(parallaxOffset(Number.NaN, 0, 900, 0.1)).toBe(0);
    expect(parallaxOffset(100, 0, 900, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("quantise", () => {
  it("rounds to the nearest half pixel", () => {
    expect(quantise(1.3)).toBe(1.5);
    expect(quantise(1.2)).toBe(1);
    expect(quantise(-2.8)).toBe(-3);
  });

  it("never yields negative zero", () => {
    expect(Object.is(quantise(-0.1), 0)).toBe(true);
  });
});
