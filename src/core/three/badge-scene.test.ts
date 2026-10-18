import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  renderers: [] as { domElement: HTMLCanvasElement; dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn>; render: ReturnType<typeof vi.fn> }[],
  failLanyard: false,
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  impulses: [] as number[],
}));

vi.mock("@/core/lib/scroll-motion", () => ({
  scrollMotion: {
    subscribe: (listener: (sample: { scrollY: number; velocity: number }) => void) => {
      mocks.subscribe(listener);
      return mocks.unsubscribe;
    },
  },
}));

vi.mock("@/core/lib/physics/rope-sim", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/lib/physics/rope-sim")>();
  return {
    ...actual,
    createRopeSim: (...args: Parameters<typeof actual.createRopeSim>) => {
      const sim = actual.createRopeSim(...args);
      return {
        ...sim,
        applyScrollImpulse: (velocity: number, dt?: number) => {
          mocks.impulses.push(velocity);
          sim.applyScrollImpulse(velocity, dt);
        },
      };
    },
  };
});

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class FakeRenderer {
    domElement = document.createElement("canvas");
    capabilities = { getMaxAnisotropy: () => 4 };
    shadowMap = { enabled: false, type: 0 };
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    constructor() {
      mocks.renderers.push(this);
    }
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

vi.mock("./lanyard-mesh", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lanyard-mesh")>();
  return {
    ...actual,
    createLanyard: (...args: Parameters<typeof actual.createLanyard>) => {
      if (mocks.failLanyard) throw new Error("lanyard failed");
      return actual.createLanyard(...args);
    },
  };
});

import { createBadgeScene } from "./badge-scene";

const options = { fonts: { body: "Body", display: "Display" }, images: { photo: null }, reducedMotion: false };
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let container: HTMLElement;

beforeEach(() => {
  mocks.renderers.length = 0;
  mocks.failLanyard = false;
  mocks.subscribe.mockReset();
  mocks.unsubscribe.mockReset();
  mocks.impulses.length = 0;
  frames = new Map();
  nextFrame = 1;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextFrame, cb);
    return nextFrame++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("ResizeObserver", class { observe = vi.fn(); disconnect = vi.fn(); });
  vi.stubGlobal("IntersectionObserver", class { observe = vi.fn(); disconnect = vi.fn(); });
  container = document.createElement("div");
  Object.defineProperty(container, "clientWidth", { value: 600 });
  Object.defineProperty(container, "clientHeight", { value: 500 });
  document.body.append(container);
});

afterEach(() => {
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createBadgeScene", () => {
  it("mounts a canvas, renders once and starts the loop", () => {
    createBadgeScene(container, options);

    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(mocks.renderers[0].render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(1);
  });

  it("disposes everything once and stops the loop", () => {
    const handle = createBadgeScene(container, options);

    handle.dispose();
    handle.dispose();

    expect(container.querySelector("canvas")).toBeNull();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.renderers[0].forceContextLoss).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("does not leak the canvas or renderer when construction throws", () => {
    mocks.failLanyard = true;

    expect(() => createBadgeScene(container, options)).toThrow("lanyard failed");

    expect(container.querySelector("canvas")).toBeNull();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
  });

  it("stops and reports when the WebGL context is lost", () => {
    const onLost = vi.fn();
    createBadgeScene(container, { ...options, onLost });
    const event = new Event("webglcontextlost", { cancelable: true });

    mocks.renderers[0].domElement.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("stops listening for context loss after dispose", () => {
    const onLost = vi.fn();
    const handle = createBadgeScene(container, { ...options, onLost });
    const canvas = mocks.renderers[0].domElement;

    handle.dispose();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));

    expect(onLost).not.toHaveBeenCalled();
  });

  it("redraw repaints the canvas textures", () => {
    const fillText = vi.spyOn(CanvasRenderingContext2D.prototype, "fillText");
    const handle = createBadgeScene(container, options);
    const before = fillText.mock.calls.length;

    handle.redraw();

    expect(fillText.mock.calls.length).toBeGreaterThan(before);
  });

  describe("scroll inertia", () => {
    let visibility: (entries: { isIntersecting: boolean }[]) => void;

    beforeEach(() => {
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(cb: typeof visibility) {
            visibility = cb;
          }
          observe = vi.fn();
          disconnect = vi.fn();
        },
      );
    });

    it("subscribes to scroll motion while mounted and forwards velocity to the rope", () => {
      createBadgeScene(container, options);

      expect(mocks.subscribe).toHaveBeenCalledTimes(1);
      mocks.subscribe.mock.calls[0][0]({ scrollY: 120, velocity: 900 });
      expect(mocks.impulses).toEqual([]);
      const [id, callback] = [...frames.entries()][0];
      frames.delete(id);
      callback(performance.now() + 16);

      expect(mocks.impulses).toEqual([900]);
    });

    it("unsubscribes when the badge scrolls out of view and resubscribes when it returns", () => {
      createBadgeScene(container, options);

      visibility([{ isIntersecting: false }]);
      expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
      visibility([{ isIntersecting: true }]);

      expect(mocks.subscribe).toHaveBeenCalledTimes(2);
    });

    it("unsubscribes on dispose and never leaks a second subscription", () => {
      const handle = createBadgeScene(container, options);

      handle.dispose();
      handle.dispose();

      expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("does not subscribe when reduced motion is requested", () => {
      createBadgeScene(container, { ...options, reducedMotion: true });

      expect(mocks.subscribe).not.toHaveBeenCalled();
    });

    it("exposes the card swing in degrees for diagnostics", () => {
      createBadgeScene(container, options);

      expect(container.dataset.swing).toMatch(/^-?\d+(\.\d+)?$/);
    });
  });
});
