import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useParallax } from "./useParallax";

const VIEWPORT_H = 900;
let scrollY: number;
let rectCalls: number;
let intersect: (el: Element, isIntersecting: boolean) => void;
let observers: { disconnect: ReturnType<typeof vi.fn>; callback: IntersectionObserverCallback; seen: Set<Element> }[];
let resizeCallbacks: ResizeObserverCallback[];
let resizeDisconnect: ReturnType<typeof vi.fn>;

function place(el: HTMLElement, documentTop: number, height: number): void {
  el.getBoundingClientRect = () => {
    rectCalls++;
    const top = documentTop - scrollY;
    return { top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) };
  };
}

function scrollTo(y: number): void {
  scrollY = y;
  window.dispatchEvent(new Event("scroll"));
  vi.advanceTimersByTime(20);
}

function py(el: Element): string {
  return (el as HTMLElement).style.getPropertyValue("--py");
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollY = 0;
  rectCalls = 0;
  observers = [];
  resizeCallbacks = [];
  resizeDisconnect = vi.fn();
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: VIEWPORT_H });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly seen = new Set<Element>();
      readonly disconnect = vi.fn();
      constructor(readonly callback: IntersectionObserverCallback) {
        observers.push(this);
      }
      observe(el: Element) {
        this.seen.add(el);
      }
      unobserve() {}
    },
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
      }
      observe() {}
      disconnect = resizeDisconnect;
    },
  );
  intersect = (el, isIntersecting) => {
    for (const io of observers) {
      if (!io.seen.has(el)) continue;
      io.callback([{ target: el, isIntersecting } as IntersectionObserverEntry], io as unknown as IntersectionObserver);
    }
  };
  document.body.innerHTML = `<div id="a" data-parallax="0.1"></div><div id="b" data-parallax="-0.05"></div><div id="c"></div>`;
  place(document.getElementById("a")!, 1000, 100);
  place(document.getElementById("b")!, 1000, 100);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

const a = () => document.getElementById("a")!;
const b = () => document.getElementById("b")!;

describe("useParallax", () => {
  it("writes a quantised --py for visible elements while scrolling", () => {
    renderHook(() => useParallax());
    intersect(a(), true);

    scrollTo(600);

    expect(py(a())).toBe("0");
    scrollTo(700);
    expect(py(a())).toBe("10");
    scrollTo(706);
    expect(py(a())).toBe("10.5");
  });

  it("applies the sign of each element's speed", () => {
    renderHook(() => useParallax());
    intersect(a(), true);
    intersect(b(), true);

    scrollTo(700);

    expect(py(a())).toBe("10");
    expect(py(b())).toBe("-5");
  });

  it("skips elements that are outside the viewport band", () => {
    renderHook(() => useParallax());

    scrollTo(700);

    expect(py(a())).toBe("");
    intersect(a(), true);
    expect(py(a())).toBe("10");
    intersect(a(), false);
    scrollTo(800);
    expect(py(a())).toBe("10");
  });

  it("ignores elements without a usable speed", () => {
    document.body.innerHTML = `<div id="x" data-parallax="abc"></div>`;
    renderHook(() => useParallax());

    expect(observers.every((io) => io.seen.size === 0)).toBe(true);
  });

  it("writes only when the quantised value changes", () => {
    renderHook(() => useParallax());
    intersect(a(), true);
    scrollTo(700);
    const setProperty = vi.spyOn(a().style, "setProperty");

    scrollTo(701);

    expect(setProperty).not.toHaveBeenCalled();
  });

  it("measures on mount and resize only, never per scroll frame", () => {
    renderHook(() => useParallax());
    intersect(a(), true);
    const afterMount = rectCalls;

    for (let y = 0; y < 600; y += 20) scrollTo(y);
    expect(rectCalls).toBe(afterMount);

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    expect(rectCalls).toBeGreaterThan(afterMount);
  });

  it("re-measures when the body resizes", () => {
    renderHook(() => useParallax());
    const before = rectCalls;

    resizeCallbacks[0]?.([], {} as ResizeObserver);
    vi.advanceTimersByTime(20);

    expect(rectCalls).toBeGreaterThan(before);
  });

  it("re-measures when the page finishes loading", () => {
    renderHook(() => useParallax());
    const before = rectCalls;

    window.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(20);

    expect(rectCalls).toBeGreaterThan(before);
  });

  it("does not drift when re-measuring an element that already carries an offset", () => {
    renderHook(() => useParallax());
    intersect(a(), true);
    scrollTo(700);
    const shifted = a().getBoundingClientRect;
    a().getBoundingClientRect = () => {
      const rect = shifted();
      return { ...rect, top: rect.top + 10, bottom: rect.bottom + 10 };
    };

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);
    scrollTo(701);

    expect(py(a())).toBe("10");
  });

  it("cleans up listeners, observers and the written variable", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useParallax());
    intersect(a(), true);
    scrollTo(700);

    unmount();

    expect(py(a())).toBe("");
    expect(observers[0]?.disconnect).toHaveBeenCalled();
    expect(resizeDisconnect).toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("load", expect.any(Function));
    scrollTo(900);
    expect(py(a())).toBe("");
  });

  it("is StrictMode-safe", () => {
    renderHook(() => useParallax(), { wrapper: StrictMode });
    for (const io of observers) if (io.disconnect.mock.calls.length === 0) io.seen.forEach((el) => intersect(el, true));

    scrollTo(700);

    expect(py(a())).toBe("10");
  });

  it("attaches nothing and writes nothing under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const add = vi.spyOn(window, "addEventListener");
    renderHook(() => useParallax());

    scrollTo(700);

    expect(observers).toHaveLength(0);
    expect(resizeCallbacks).toHaveLength(0);
    expect(add).not.toHaveBeenCalledWith("scroll", expect.any(Function), expect.anything());
    expect(py(a())).toBe("");
  });

  it("does nothing where IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    renderHook(() => useParallax());
    scrollTo(700);

    expect(py(a())).toBe("");
  });
  it("keeps a nested layer stable across re-measures while its parent layer is offset", () => {
    document.body.innerHTML = `<div id="outer" data-parallax="0.1"><span id="inner" data-parallax="0.02"></span></div>`;
    const outer = document.getElementById("outer")!;
    const inner = document.getElementById("inner")!;
    place(outer, 1000, 200);
    inner.getBoundingClientRect = () => {
      const top = 1050 + Number(py(outer) || 0) - scrollY;
      return { top, bottom: top + 40, height: 40, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) };
    };
    renderHook(() => useParallax());
    intersect(outer, true);
    intersect(inner, true);
    scrollTo(1400);
    const before = py(inner);
    expect(Number(py(outer))).not.toBe(0);

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(20);

    expect(py(inner)).toBe(before);
  });
});
