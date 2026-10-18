import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRibbonBoost } from "./useRibbonBoost";

let scrollY: number;
let ribbon: HTMLElement;
let animation: { playbackRate: number };
let getAnimations: ReturnType<typeof vi.fn>;

function scrollTo(y: number): void {
  scrollY = y;
  window.dispatchEvent(new Event("scroll"));
  vi.advanceTimersByTime(16);
}

function keepScrolling(from: number, step: number, frames: number): number {
  let y = from;
  for (let i = 0; i < frames; i++) {
    y += step;
    scrollTo(y);
  }
  return y;
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollY = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  animation = { playbackRate: 1 };
  getAnimations = vi.fn(() => [animation]);
  document.body.innerHTML = `<div class="ribbon-wrap"><div class="ribbon"><div class="ribbon-track"></div></div></div>`;
  ribbon = document.querySelector<HTMLElement>(".ribbon")!;
  document.querySelector<HTMLElement>(".ribbon-track")!.getAnimations = getAnimations as unknown as HTMLElement["getAnimations"];
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("useRibbonBoost", () => {
  it("speeds the marquee up while scrolling", () => {
    renderHook(() => useRibbonBoost());

    keepScrolling(0, 40, 10);

    expect(animation.playbackRate).toBeGreaterThan(1.5);
  });

  it("never reverses or exceeds the cap on a violent fling", () => {
    renderHook(() => useRibbonBoost());

    keepScrolling(0, 50_000, 20);
    expect(animation.playbackRate).toBeLessThanOrEqual(8);
    keepScrolling(scrollY, -50_000, 20);

    expect(animation.playbackRate).toBeGreaterThanOrEqual(1);
  });

  it("skews in the scroll direction and flips with it", () => {
    renderHook(() => useRibbonBoost());

    const y = keepScrolling(0, 40, 10);
    const down = Number(ribbon.style.getPropertyValue("--ribbon-skew"));
    keepScrolling(y, -80, 14);
    const up = Number(ribbon.style.getPropertyValue("--ribbon-skew"));

    expect(down).toBeGreaterThan(0);
    expect(up).toBeLessThan(0);
    expect(Math.abs(down)).toBeLessThanOrEqual(4);
    expect(Math.abs(up)).toBeLessThanOrEqual(4);
  });

  it("returns playbackRate to exactly 1 and clears the skew after scrolling stops", () => {
    renderHook(() => useRibbonBoost());
    keepScrolling(0, 60, 12);
    expect(animation.playbackRate).toBeGreaterThan(1);

    vi.advanceTimersByTime(3000);

    expect(animation.playbackRate).toBe(1);
    expect(Number(ribbon.style.getPropertyValue("--ribbon-skew"))).toBe(0);
  });

  it("only asks for animations when the rate actually changes", () => {
    renderHook(() => useRibbonBoost());
    vi.advanceTimersByTime(500);

    expect(getAnimations).not.toHaveBeenCalled();
  });

  it("restores normal speed and removes the variable on unmount", () => {
    const { unmount } = renderHook(() => useRibbonBoost());
    keepScrolling(0, 60, 8);

    unmount();

    expect(animation.playbackRate).toBe(1);
    expect(ribbon.style.getPropertyValue("--ribbon-skew")).toBe("");
  });

  it("detaches its scroll listener on unmount and survives StrictMode", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useRibbonBoost(), { wrapper: StrictMode });
    const attached = add.mock.calls.filter(([t]) => t === "scroll").length;
    expect(attached - remove.mock.calls.filter(([t]) => t === "scroll").length).toBe(1);

    unmount();

    expect(remove.mock.calls.filter(([t]) => t === "scroll")).toHaveLength(attached);
  });

  it("leaves the marquee alone under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useRibbonBoost());

    keepScrolling(0, 60, 10);

    expect(add.mock.calls.filter(([t]) => t === "scroll")).toHaveLength(0);
    expect(animation.playbackRate).toBe(1);
    expect(ribbon.style.getPropertyValue("--ribbon-skew")).toBe("");
  });

  it("tolerates browsers without getAnimations", () => {
    document.querySelector<HTMLElement>(".ribbon-track")!.getAnimations = undefined as unknown as HTMLElement["getAnimations"];
    renderHook(() => useRibbonBoost());

    expect(() => keepScrolling(0, 40, 6)).not.toThrow();
  });

  it("does nothing when there is no ribbon", () => {
    document.body.replaceChildren();

    expect(() => renderHook(() => useRibbonBoost())).not.toThrow();
  });
});
