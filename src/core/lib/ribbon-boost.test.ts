import { describe, expect, it } from "vitest";
import { ribbonPlaybackRate, ribbonSkew } from "./ribbon-boost";

describe("ribbonPlaybackRate", () => {
  it("is exactly 1 at rest and grows with speed in either direction", () => {
    expect(ribbonPlaybackRate(0)).toBe(1);
    expect(ribbonPlaybackRate(800)).toBeGreaterThan(1);
    expect(ribbonPlaybackRate(-800)).toBe(ribbonPlaybackRate(800));
  });

  it("is capped and tolerates garbage", () => {
    expect(ribbonPlaybackRate(1e9)).toBe(7);
    expect(ribbonPlaybackRate(Number.NaN)).toBe(1);
  });
});

describe("ribbonSkew", () => {
  it("follows the sign of the scroll and is capped", () => {
    expect(ribbonSkew(600)).toBeGreaterThan(0);
    expect(ribbonSkew(-600)).toBeLessThan(0);
    expect(ribbonSkew(1e9)).toBe(3);
    expect(ribbonSkew(-1e9)).toBe(-3);
    expect(ribbonSkew(Number.NaN)).toBe(0);
  });
});
