import { afterEach, describe, expect, it, vi } from "vitest";
import { computeFraming, isWideViewport, stackedStageHeight, WIDE_BREAKPOINT } from "./framing";

describe("computeFraming", () => {
  it("pins the badge on the right column about 150px below the top on wide panels", () => {
    const f = computeFraming(1440, 756);

    expect(f.anchorX).toBeCloseTo(1.55);
    const pinPx = (1 - f.anchorY / f.halfHeight) * 0.5 * 756;
    expect(pinPx).toBeCloseTo(150, 0);
    expect(f.cameraZ).toBeGreaterThanOrEqual(8.4);
  });

  it("keeps the anchor inside narrow wide panels", () => {
    const f = computeFraming(WIDE_BREAKPOINT, 640);

    expect(f.anchorX).toBeLessThanOrEqual(f.halfWidth - 1.8 + 1e-9);
  });

  it("switches to two columns from 900px", () => {
    expect(WIDE_BREAKPOINT).toBe(900);
  });

  it.each([390, 600, 768, 899])("stacked %ipx: pin 32px under the box top, card 84% of the width capped at 560px", (width) => {
    const height = stackedStageHeight(width);
    const f = computeFraming(width, height);

    const pxPerUnit = height / (2 * f.halfHeight);
    expect(f.anchorX).toBe(0);
    expect((1 - f.anchorY / f.halfHeight) * 0.5 * height).toBeCloseTo(32, 5);
    expect(3.4 * pxPerUnit).toBeCloseTo(Math.min(560, width * 0.84), 5);
  });

  it("derives the stacked box height from the card so the lowest swing stays inside", () => {
    const width = 390;
    const pxPerUnit = (width * 0.84) / 3.4;

    expect(stackedStageHeight(width)).toBeCloseTo(32 + 3.2 * pxPerUnit, 5);
    expect(stackedStageHeight(800)).toBeCloseTo(32 + 3.2 * (560 / 3.4), 5);
  });

  it("is stacked just under the breakpoint", () => {
    expect(computeFraming(WIDE_BREAKPOINT - 1, 800).anchorX).toBe(0);
  });
});

describe("layout mode follows the CSS media query, not the container width", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("frames stacked when told so even if the container is wider than the breakpoint", () => {
    expect(computeFraming(WIDE_BREAKPOINT + 10, 900, { wide: false }).anchorX).toBe(0);
  });

  it("frames wide when told so even if a scrollbar makes the container narrower", () => {
    expect(computeFraming(WIDE_BREAKPOINT - 10, 640, { wide: true }).anchorX).toBeGreaterThan(0);
  });

  it("reads the same min-width query the stylesheet uses", () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    vi.stubGlobal("matchMedia", matchMedia);

    expect(isWideViewport()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(`(min-width: ${WIDE_BREAKPOINT}px)`);
  });

  it("falls back to false where matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(isWideViewport()).toBe(false);
  });
});
