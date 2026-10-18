import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rafThrottle } from "./raf-throttle";

let queue: FrameRequestCallback[];

beforeEach(() => {
  queue = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {
    queue = [];
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("rafThrottle", () => {
  it("runs once per frame with the latest argument", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled.call(1);
    throttled.call(2);
    throttled.call(3);
    queue.forEach((cb) => cb(0));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("schedules again after a frame ran", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);
    throttled.call(1);
    queue.splice(0).forEach((cb) => cb(0));

    throttled.call(2);
    queue.splice(0).forEach((cb) => cb(0));

    expect(fn.mock.calls).toEqual([[1], [2]]);
  });

  it("cancel drops the pending call", () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);
    throttled.call(1);

    throttled.cancel();
    queue.forEach((cb) => cb(0));

    expect(fn).not.toHaveBeenCalled();
  });
});
