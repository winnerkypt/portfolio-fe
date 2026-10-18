import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHeroExit } from "./useHeroExit";

const HERO_H = 800;
let scrollY: number;
let hero: HTMLElement;

function scrollTo(y: number): void {
  scrollY = y;
  window.dispatchEvent(new Event("scroll"));
  vi.advanceTimersByTime(20);
}

function exit(): string {
  return hero.style.getPropertyValue("--hero-exit");
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollY = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  document.documentElement.style.setProperty("--nav-h", "76px");
  hero = document.createElement("section");
  hero.className = "hero";
  hero.getBoundingClientRect = () => ({ top: -scrollY, height: HERO_H }) as DOMRect;
  document.body.append(hero);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
});

describe("useHeroExit", () => {
  it("starts at 0 so the static hero is untouched", () => {
    renderHook(() => useHeroExit());

    expect(exit()).not.toBe("");
    expect(Number(exit())).toBe(0);
    expect(hero).not.toHaveAttribute("data-exiting");
  });

  it("writes --hero-exit from the scroll position without re-rendering React", () => {
    let renders = 0;
    renderHook(() => {
      renders += 1;
      useHeroExit();
    });
    const before = renders;

    scrollTo(362);
    expect(Number(exit())).toBeCloseTo(0.5, 2);
    scrollTo(5000);

    expect(Number(exit())).toBe(1);
    expect(renders).toBe(before);
  });

  it("flags data-exiting only while progress is strictly between 0 and 1", () => {
    renderHook(() => useHeroExit());

    scrollTo(300);
    expect(hero).toHaveAttribute("data-exiting");
    scrollTo(5000);
    expect(hero).not.toHaveAttribute("data-exiting");
    scrollTo(0);
    expect(hero).not.toHaveAttribute("data-exiting");
  });

  it("returns to 0 after scrolling back to the top", () => {
    renderHook(() => useHeroExit());

    scrollTo(400);
    scrollTo(0);

    expect(Number(exit())).toBe(0);
  });

  it("skips redundant style writes when progress did not change", () => {
    renderHook(() => useHeroExit());
    scrollTo(300);
    const set = vi.spyOn(hero.style, "setProperty");

    scrollTo(300);

    expect(set).not.toHaveBeenCalled();
  });

  it("cleans up the listener, the variable and the flag on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useHeroExit());
    scrollTo(300);

    unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(exit()).toBe("");
    expect(hero).not.toHaveAttribute("data-exiting");
    scrollTo(500);
    expect(exit()).toBe("");
  });

  it("holds a single scroll listener under StrictMode double-mount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useHeroExit(), { wrapper: StrictMode });

    const attached = add.mock.calls.filter(([t]) => t === "scroll").length;
    const detached = remove.mock.calls.filter(([t]) => t === "scroll").length;
    expect(attached - detached).toBe(1);
    scrollTo(362);
    expect(Number(exit())).toBeCloseTo(0.5, 2);
    unmount();
    expect(remove.mock.calls.filter(([t]) => t === "scroll").length).toBe(attached);
  });

  it("attaches no listener and writes nothing under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useHeroExit());

    scrollTo(400);

    expect(add.mock.calls.filter(([t]) => t === "scroll")).toHaveLength(0);
    expect(exit()).toBe("");
  });

  it("does nothing when the hero is not on the page", () => {
    hero.remove();

    expect(() => renderHook(() => useHeroExit())).not.toThrow();
  });
  it("measures the hero once per mount or resize, not on every scroll frame", () => {
    const measure = vi.spyOn(hero, "getBoundingClientRect");
    renderHook(() => useHeroExit());
    const afterMount = measure.mock.calls.length;

    scrollTo(100);
    scrollTo(200);
    scrollTo(300);
    expect(measure.mock.calls.length).toBe(afterMount);

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    expect(measure.mock.calls.length).toBeGreaterThan(afterMount);
  });

  it("quantises --hero-exit to two decimals to limit style recalcs", () => {
    renderHook(() => useHeroExit());

    scrollTo(123);

    expect(exit()).toMatch(/^\d\.\d{2}$/);
  });
});
