import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollSpy } from "./useScrollSpy";

const ids = ["about", "skills", "projects", "contact"] as const;
const DOC_H = 4300;
const VIEWPORT_H = 1000;

function layout(y: number): void {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.getBoundingClientRect = () => ({ top: 600 + i * 900 - y }) as DOMRect;
  });
}

function mountSections(): void {
  for (const id of ids) {
    const el = document.createElement("section");
    el.id = id;
    document.body.append(el);
  }
  layout(0);
}

function scrollTo(y: number): void {
  layout(y);
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(20);
  });
}

describe("useScrollSpy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mountSections();
    Object.defineProperty(window, "innerHeight", { value: VIEWPORT_H, configurable: true });
    Object.defineProperty(document.documentElement, "scrollHeight", { value: DOC_H, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("starts with no current section and not scrolled", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    expect(result.current.current).toBeNull();
    expect(result.current.scrolled).toBe(false);
  });

  it("tracks the section crossing 35% of the viewport", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    scrollTo(300);
    expect(result.current.current).toBe("about");
    scrollTo(1200);
    expect(result.current.current).toBe("skills");
  });

  it("flags scrolled once past 8px", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    scrollTo(8);
    expect(result.current.scrolled).toBe(false);
    scrollTo(9);
    expect(result.current.scrolled).toBe(true);
  });

  it("picks contact at the document end", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    scrollTo(DOC_H - VIEWPORT_H);
    expect(result.current.current).toBe("contact");
  });

  it("lock pins the clicked id until scrolling settles", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => result.current.lock("projects"));
    expect(result.current.current).toBe("projects");
    scrollTo(300);
    expect(result.current.current).toBe("projects");
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.current).toBe("about");
  });

  it("lock releases after 900ms without scrolling", () => {
    const { result } = renderHook(() => useScrollSpy(ids));

    act(() => result.current.lock("projects"));
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.current).toBeNull();
  });

  it("removes its listeners on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollSpy(ids));

    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
