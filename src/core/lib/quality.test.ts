import { afterEach, describe, expect, it, vi } from "vitest";
import { IDLE_FRAME_MS, isCoarsePointer, sheetSize, shadowMapSize, shouldRenderFrame } from "./quality";

afterEach(() => vi.unstubAllGlobals());

describe("isCoarsePointer", () => {
  it("reads the pointer media query", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(pointer: coarse)" }));
    expect(isCoarsePointer()).toBe(true);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    expect(isCoarsePointer()).toBe(false);
  });

  it("is false without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(isCoarsePointer()).toBe(false);
  });
});

describe("render budgets", () => {
  it("uses half-size sheet canvases on coarse pointers", () => {
    expect(sheetSize(false)).toEqual({ width: 1280, height: 800 });
    expect(sheetSize(true)).toEqual({ width: 640, height: 400 });
  });

  it("uses a smaller sun shadow map on coarse pointers", () => {
    expect(shadowMapSize(false)).toEqual({ width: 2048, height: 1024 });
    expect(shadowMapSize(true)).toEqual({ width: 1024, height: 512 });
  });
});

describe("shouldRenderFrame", () => {
  it("always renders when no interval is requested", () => {
    expect(shouldRenderFrame(1000, 999, 0)).toBe(true);
  });

  it("skips frames that arrive before the idle interval", () => {
    expect(shouldRenderFrame(1016.6, 1000, IDLE_FRAME_MS)).toBe(false);
  });

  it("renders the second 60Hz frame of an idle 30fps cadence", () => {
    expect(shouldRenderFrame(1033.3, 1000, IDLE_FRAME_MS)).toBe(true);
  });
});
