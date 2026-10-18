import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScrollMotion } from "./scroll-motion";

let queue: Map<number, FrameRequestCallback>;
let nextId: number;
let clock: number;
let scrollY: number;

function frame(advanceMs = 16): void {
  clock += advanceMs;
  const pending = [...queue.values()];
  queue.clear();
  for (const cb of pending) cb(clock);
}

function scrollTo(y: number): void {
  scrollY = y;
  window.dispatchEvent(new Event("scroll"));
}

beforeEach(() => {
  queue = new Map();
  nextId = 1;
  clock = 1000;
  scrollY = 0;
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createScrollMotion", () => {
  it("attaches one passive scroll listener for any number of subscribers", () => {
    const add = vi.spyOn(window, "addEventListener");
    const motion = createScrollMotion();

    motion.subscribe(vi.fn());
    motion.subscribe(vi.fn());

    const scrollCalls = add.mock.calls.filter(([type]) => type === "scroll");
    expect(scrollCalls).toHaveLength(1);
    expect(scrollCalls[0][2]).toMatchObject({ passive: true });
  });

  it("emits one sample per frame no matter how many scroll events fire", () => {
    const motion = createScrollMotion();
    const listener = vi.fn();
    motion.subscribe(listener);

    scrollTo(10);
    scrollTo(20);
    scrollTo(30);
    expect(listener).not.toHaveBeenCalled();
    frame();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].scrollY).toBe(30);
  });

  it("reports a signed velocity that follows the scroll direction", () => {
    const motion = createScrollMotion();
    const listener = vi.fn();
    motion.subscribe(listener);

    scrollTo(100);
    frame();
    expect(listener.mock.lastCall?.[0].velocity).toBeGreaterThan(0);

    scrollTo(0);
    frame();
    frame();
    expect(listener.mock.lastCall?.[0].velocity).toBeLessThan(listener.mock.calls[0][0].velocity);
  });

  it("keeps sampling while velocity decays, then settles at zero and goes idle", () => {
    const motion = createScrollMotion();
    const listener = vi.fn();
    motion.subscribe(listener);

    scrollTo(400);
    for (let i = 0; i < 200 && queue.size; i++) frame();

    expect(listener.mock.lastCall?.[0].velocity).toBe(0);
    expect(queue.size).toBe(0);
  });

  it("does not under-report the first sample after a long idle gap", () => {
    const motion = createScrollMotion();
    const listener = vi.fn();
    motion.subscribe(listener);
    scrollTo(100);
    for (let i = 0; i < 200 && queue.size; i++) frame();
    clock += 60_000;

    scrollTo(160);
    frame(16);

    expect(listener.mock.lastCall?.[0].velocity).toBeGreaterThan(200);
  });

  it("stops delivering and detaches listeners after the last unsubscribe", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const motion = createScrollMotion();
    const first = vi.fn();
    const off = motion.subscribe(first);
    const offSecond = motion.subscribe(vi.fn());

    off();
    expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(0);
    offSecond();
    scrollTo(50);
    frame();

    expect(remove.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);
    expect(first).not.toHaveBeenCalled();
    expect(queue.size).toBe(0);
  });

  it("is idempotent when the same unsubscribe runs twice", () => {
    const motion = createScrollMotion();
    const off = motion.subscribe(vi.fn());

    off();

    expect(() => off()).not.toThrow();
  });

  it("samples on resize so layout-derived values refresh", () => {
    const motion = createScrollMotion();
    const listener = vi.fn();
    motion.subscribe(listener);

    window.dispatchEvent(new Event("resize"));
    frame();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("attaches nothing under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const add = vi.spyOn(window, "addEventListener");
    const motion = createScrollMotion();
    const listener = vi.fn();

    const off = motion.subscribe(listener);
    scrollTo(300);
    frame();

    expect(add.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();
    expect(() => off()).not.toThrow();
  });

  it("survives a listener that unsubscribes during delivery", () => {
    const motion = createScrollMotion();
    const other = vi.fn();
    const off = motion.subscribe(() => off());
    motion.subscribe(other);

    scrollTo(10);
    frame();

    expect(other).toHaveBeenCalledTimes(1);
  });
});
