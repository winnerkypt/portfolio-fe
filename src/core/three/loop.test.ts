import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLoop } from "./loop";

let queue: Map<number, FrameRequestCallback>;
let nextId: number;
let clock: number;

function flushFrame(advanceMs: number): void {
  clock += advanceMs;
  const pending = [...queue.entries()];
  queue.clear();
  for (const [, cb] of pending) cb(clock);
}

beforeEach(() => {
  queue = new Map();
  nextId = 1;
  clock = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
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

describe("createLoop", () => {
  it("renders on every frame while active", () => {
    const render = vi.fn();
    const loop = createLoop(render, { isActive: () => true });

    loop.sync();
    flushFrame(16);
    flushFrame(16);

    expect(render).toHaveBeenCalledTimes(2);
  });

  it("clamps long frame gaps", () => {
    const render = vi.fn();
    const loop = createLoop(render, { isActive: () => true });

    loop.sync();
    flushFrame(5000);

    expect(render.mock.calls[0][0]).toBeCloseTo(1 / 30, 5);
  });

  it("does not schedule twice when sync is called repeatedly", () => {
    const loop = createLoop(vi.fn(), { isActive: () => true });

    loop.sync();
    loop.sync();

    expect(queue.size).toBe(1);
  });

  it("stops scheduling when inactive and resumes with a fresh time base", () => {
    let active = true;
    const render = vi.fn();
    const loop = createLoop(render, { isActive: () => active });
    loop.sync();
    flushFrame(16);

    active = false;
    flushFrame(16);
    expect(queue.size).toBe(0);

    clock += 60_000;
    active = true;
    loop.sync();
    flushFrame(16);

    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls[1][0]).toBeCloseTo(0.016, 5);
  });

  it("never starts after stop", () => {
    const render = vi.fn();
    const loop = createLoop(render, { isActive: () => true });
    loop.sync();

    loop.stop();
    loop.sync();
    flushFrame(16);

    expect(render).not.toHaveBeenCalled();
    expect(queue.size).toBe(0);
  });

  it("skips frames inside the requested interval and passes the accumulated dt on the next render", () => {
    const render = vi.fn();
    const loop = createLoop(render, { isActive: () => true, frameInterval: () => 1000 / 30 });

    loop.sync();
    flushFrame(16.6);
    flushFrame(16.6);

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toBeCloseTo(1 / 30, 2);
  });

  it("returns to every frame once the interval drops to zero", () => {
    const render = vi.fn();
    let interval = 1000 / 30;
    const loop = createLoop(render, { isActive: () => true, frameInterval: () => interval });

    loop.sync();
    flushFrame(16.6);
    flushFrame(16.6);
    interval = 0;
    flushFrame(16.6);
    flushFrame(16.6);

    expect(render).toHaveBeenCalledTimes(3);
  });
});
