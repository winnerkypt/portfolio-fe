import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNavLock, navLockReducer } from "./nav-lock";

describe("navLockReducer", () => {
  it("locks on click and releases", () => {
    const locked = navLockReducer({ id: null }, { type: "click", id: "skills" });
    expect(locked).toEqual({ id: "skills" });
    expect(navLockReducer(locked, { type: "release" })).toEqual({ id: null });
  });

  it("does not mutate the previous state", () => {
    const prev = Object.freeze({ id: null });
    expect(() => navLockReducer(prev, { type: "click", id: "about" })).not.toThrow();
  });
});

describe("createNavLock", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports the locked id and releases 900ms after a click without scroll", () => {
    const onRelease = vi.fn();
    const lock = createNavLock(onRelease);

    lock.click("skills");
    expect(lock.id()).toBe("skills");
    vi.advanceTimersByTime(899);
    expect(lock.id()).toBe("skills");
    vi.advanceTimersByTime(1);
    expect(lock.id()).toBeNull();
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it("releases 160ms after the last scroll event, extending on each scroll", () => {
    const onRelease = vi.fn();
    const lock = createNavLock(onRelease);

    lock.click("projects");
    vi.advanceTimersByTime(300);
    lock.scroll();
    vi.advanceTimersByTime(100);
    lock.scroll();
    vi.advanceTimersByTime(159);
    expect(lock.id()).toBe("projects");
    vi.advanceTimersByTime(1);
    expect(lock.id()).toBeNull();
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it("ignores scroll when not locked", () => {
    const onRelease = vi.fn();
    const lock = createNavLock(onRelease);

    lock.scroll();
    vi.advanceTimersByTime(1000);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it("dispose cancels the pending release", () => {
    const onRelease = vi.fn();
    const lock = createNavLock(onRelease);

    lock.click("about");
    lock.dispose();
    vi.advanceTimersByTime(1000);
    expect(onRelease).not.toHaveBeenCalled();
  });
});
