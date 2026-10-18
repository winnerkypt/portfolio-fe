import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReveal } from "./useReveal";

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed = new Set<Element>();
  disconnect = vi.fn();
  constructor(private readonly cb: Callback) {
    FakeObserver.instances.push(this);
  }
  observe = (el: Element) => void this.observed.add(el);
  unobserve = (el: Element) => void this.observed.delete(el);
  fire(target: Element, isIntersecting = true): void {
    this.cb([{ target, isIntersecting }]);
  }
}

const rules = [
  { selector: ".a" },
  { selector: ".b", kind: "left" },
  { selector: ".list > li", stagger: true },
] as const;

function mount(): void {
  document.body.innerHTML = `<div class="a"></div><div class="b"></div><ul class="list"><li></li><li></li></ul>`;
}

function mockMotion(reduce: boolean): void {
  vi.stubGlobal("matchMedia", () => ({ matches: reduce }));
}

describe("useReveal", () => {
  beforeEach(() => {
    FakeObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    mockMotion(false);
    mount();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    document.documentElement.className = "";
  });

  it("marks elements with their kind and stagger index, then enables motion", () => {
    renderHook(() => useReveal(rules));

    expect(document.querySelector(".a")).toHaveAttribute("data-rv", "");
    expect(document.querySelector(".b")).toHaveAttribute("data-rv", "left");
    const items = document.querySelectorAll<HTMLElement>(".list > li");
    expect(items[1].style.getPropertyValue("--rv-i")).toBe("1");
    expect(document.documentElement).toHaveClass("motion");
  });

  it("adds the revealed state once and stops observing", () => {
    renderHook(() => useReveal(rules));
    const [io] = FakeObserver.instances;
    const a = document.querySelector(".a") as Element;

    io.fire(a, false);
    expect(a).not.toHaveClass("in");
    io.fire(a);
    expect(a).toHaveClass("in");
    expect(io.observed.has(a)).toBe(false);
  });

  it("leaves content untouched under reduced motion", () => {
    mockMotion(true);
    renderHook(() => useReveal(rules));

    expect(document.querySelector(".a")).not.toHaveAttribute("data-rv");
    expect(document.documentElement).not.toHaveClass("motion");
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it("leaves content untouched without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    renderHook(() => useReveal(rules));

    expect(document.documentElement).not.toHaveClass("motion");
  });

  it("undoes everything on unmount", () => {
    const { unmount } = renderHook(() => useReveal(rules));
    const [io] = FakeObserver.instances;
    io.fire(document.querySelector(".a") as Element);

    unmount();
    expect(io.disconnect).toHaveBeenCalled();
    expect(document.documentElement).not.toHaveClass("motion");
    expect(document.querySelector(".a")).not.toHaveAttribute("data-rv");
    expect(document.querySelector(".a")).not.toHaveClass("in");
  });
  it("reveals elements already on screen immediately so they do not flash hidden", () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const onScreen = document.querySelector<HTMLElement>(".a")!;
    const offScreen = document.querySelector<HTMLElement>(".b")!;
    vi.spyOn(onScreen, "getBoundingClientRect").mockReturnValue({ top: 40, bottom: 200 } as DOMRect);
    vi.spyOn(offScreen, "getBoundingClientRect").mockReturnValue({ top: 1400, bottom: 1600 } as DOMRect);

    renderHook(() => useReveal(rules));

    expect(onScreen).toHaveClass("in");
    expect(offScreen).not.toHaveClass("in");
  });
});
