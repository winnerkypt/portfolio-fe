import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Scene, PerspectiveCamera } from "three";

const mocks = vi.hoisted(() => ({
  renderers: [] as { domElement: HTMLCanvasElement; dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn>; render: ReturnType<typeof vi.fn> }[],
  failSheet: false,
}));

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  class FakeRenderer {
    domElement = document.createElement("canvas");
    capabilities = { getMaxAnisotropy: () => 4 };
    shadowMap = { enabled: false, type: 0 };
    setPixelRatio = vi.fn();
    setSize = vi.fn();
    render = vi.fn((scene: Scene, camera: PerspectiveCamera) => {
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
    });
    dispose = vi.fn();
    forceContextLoss = vi.fn();
    constructor() {
      mocks.renderers.push(this);
    }
  }
  return { ...actual, WebGLRenderer: FakeRenderer };
});

vi.mock("./sheet-mesh", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sheet-mesh")>();
  return {
    ...actual,
    createSheet: (...args: Parameters<typeof actual.createSheet>) => {
      if (mocks.failSheet) throw new Error("sheet failed");
      return actual.createSheet(...args);
    },
  };
});

import { projects } from "@/core/data/projects";
import { createDrawerScene } from "./drawer-scene";

const fonts = { body: "Body", display: "Display" };
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let container: HTMLElement;

function options(extra: Partial<Parameters<typeof createDrawerScene>[1]> = {}): Parameters<typeof createDrawerScene>[1] {
  return { projects, images: projects.map(() => null), fonts, initialIndex: 0, onSelect: vi.fn(), ...extra };
}

beforeEach(() => {
  mocks.renderers.length = 0;
  mocks.failSheet = false;
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
  Object.defineProperty(container, "clientWidth", { value: 1440 });
  Object.defineProperty(container, "clientHeight", { value: 389 });
  document.body.append(container);
});

afterEach(() => {
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createDrawerScene", () => {
  it("mounts a canvas, renders once and starts the loop", () => {
    createDrawerScene(container, options());

    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(mocks.renderers[0].render).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(1);
  });

  it("builds a folder per project and tolerates out-of-range indexes", () => {
    const handle = createDrawerScene(container, options());

    expect(() => {
      handle.setIndex(3);
      handle.setIndex(99);
      handle.setIndex(-1);
    }).not.toThrow();
  });

  it("disposes everything once and stops the loop", () => {
    const handle = createDrawerScene(container, options());

    handle.dispose();
    handle.dispose();

    expect(container.querySelector("canvas")).toBeNull();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("does not leak the canvas or renderer when construction throws", () => {
    mocks.failSheet = true;

    expect(() => createDrawerScene(container, options())).toThrow("sheet failed");

    expect(container.querySelector("canvas")).toBeNull();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledTimes(1);
  });

  it("stops and reports when the WebGL context is lost", () => {
    const onLost = vi.fn();
    createDrawerScene(container, options({ onLost }));
    const event = new Event("webglcontextlost", { cancelable: true });

    mocks.renderers[0].domElement.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("redraw repaints folder and sheet textures", () => {
    const fillText = vi.spyOn(CanvasRenderingContext2D.prototype, "fillText");
    const handle = createDrawerScene(container, options());
    const before = fillText.mock.calls.length;

    handle.redraw();

    expect(fillText.mock.calls.length).toBeGreaterThan(before);
  });

  it("reports a tap on a folder through onSelect", () => {
    const onSelect = vi.fn();
    createDrawerScene(container, options({ onSelect }));
    const canvas = mocks.renderers[0].domElement;
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1440, height: 389 }) as DOMRect;

    const tap = (x: number, y: number): void => {
      canvas.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true, button: 0 }));
      canvas.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true, button: 0 }));
    };
    for (let y = 150; y < 389; y += 20) tap(720, y);

    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("reports the scene's own index at creation, on valid changes and on taps", () => {
    const onIndexChange = vi.fn();
    const handle = createDrawerScene(container, options({ initialIndex: 1, onIndexChange }));

    handle.setIndex(3);
    handle.setIndex(99);
    handle.setIndex(3.5);

    expect(onIndexChange.mock.calls).toEqual([[1], [3]]);
  });

  it("drops to a 30fps cadence once the springs settle", () => {
    let clock = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    createDrawerScene(container, options());
    const renders = mocks.renderers[0].render;
    const run = (advance: number): void => {
      clock += advance;
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, cb]) => cb(clock));
    };
    for (let i = 0; i < 400; i++) run(16.6);
    const before = renders.mock.calls.length;

    for (let i = 0; i < 60; i++) run(16.6);

    expect(renders.mock.calls.length - before).toBeLessThanOrEqual(31);
    expect(renders.mock.calls.length - before).toBeGreaterThanOrEqual(28);
  });

  it("renders every frame while a folder is selected and still travelling", () => {
    let clock = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    const handle = createDrawerScene(container, options());
    const renders = mocks.renderers[0].render;
    const run = (advance: number): void => {
      clock += advance;
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, cb]) => cb(clock));
    };
    for (let i = 0; i < 400; i++) run(16.6);
    handle.setIndex(3);
    const before = renders.mock.calls.length;

    for (let i = 0; i < 10; i++) run(16.6);

    expect(renders.mock.calls.length - before).toBe(10);
  });
});
