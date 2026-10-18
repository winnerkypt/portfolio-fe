import { StrictMode, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dispose: vi.fn(),
  redraw: vi.fn(),
  create: vi.fn(),
  load: vi.fn(),
  hasWebGL: vi.fn(),
  prefersReducedMotion: vi.fn(),
  awaitFonts: vi.fn(),
}));

vi.mock("@/core/lib/webgl", () => ({ hasWebGL: mocks.hasWebGL }));
vi.mock("@/core/lib/motion", () => ({ prefersReducedMotion: mocks.prefersReducedMotion }));
vi.mock("@/core/lib/fonts-ready", () => ({ awaitFonts: mocks.awaitFonts }));

import { useLazyScene } from "./useLazyScene";

const fonts = { body: "Body", display: "Display" };

type Observer = { callback: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> };
let observers: Observer[] = [];
let fontsTarget: EventTarget;

function stubIntersectionObserver(): void {
  class FakeObserver {
    disconnect = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      observers.push({ callback, disconnect: this.disconnect });
    }
    observe = vi.fn();
    unobserve = vi.fn();
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
}

function intersect(isIntersecting: boolean): void {
  act(() => {
    for (const o of observers) o.callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function mount(opts: { strict?: boolean; onReady?: () => void; onLost?: () => void } = {}) {
  const ref = { current: document.createElement("div") };
  const wrapper = opts.strict ? ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode> : undefined;
  return renderHook(() => useLazyScene(ref, mocks.load, { fonts, onReady: opts.onReady, onLost: opts.onLost }), { wrapper });
}

beforeEach(() => {
  observers = [];
  fontsTarget = new EventTarget();
  Object.defineProperty(document, "fonts", { value: fontsTarget, configurable: true });
  mocks.dispose.mockReset();
  mocks.redraw.mockReset();
  mocks.create.mockReset().mockReturnValue({ dispose: mocks.dispose, redraw: mocks.redraw });
  mocks.load.mockReset().mockResolvedValue(mocks.create);
  mocks.hasWebGL.mockReset().mockReturnValue(true);
  mocks.prefersReducedMotion.mockReset().mockReturnValue(false);
  mocks.awaitFonts.mockReset().mockResolvedValue(true);
  stubIntersectionObserver();
});

afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useLazyScene", () => {
  it("never loads the scene under reduced motion", async () => {
    mocks.prefersReducedMotion.mockReturnValue(true);

    mount();
    intersect(true);
    await flush();

    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("never loads the scene without WebGL", async () => {
    mocks.hasWebGL.mockReturnValue(false);

    mount();
    intersect(true);
    await flush();

    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("waits until the container is near the viewport", async () => {
    mount();
    await flush();
    expect(mocks.load).not.toHaveBeenCalled();

    intersect(false);
    await flush();
    expect(mocks.load).not.toHaveBeenCalled();

    intersect(true);
    await flush();
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("loads fonts and assets together, then creates the scene once", async () => {
    const onReady = vi.fn();
    mount({ onReady });

    intersect(true);
    intersect(true);
    await flush();

    expect(mocks.awaitFonts).toHaveBeenCalledTimes(1);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("creates a single scene under StrictMode double effects", async () => {
    mount({ strict: true });

    intersect(true);
    await flush();

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("disposes the scene on unmount", async () => {
    const { unmount } = mount();
    intersect(true);
    await flush();

    unmount();

    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it("does not create a scene when unmounted while still loading", async () => {
    const { unmount } = mount();
    intersect(true);
    unmount();
    await flush();

    expect(mocks.create).not.toHaveBeenCalled();
    expect(observers.every((o) => o.disconnect.mock.calls.length > 0)).toBe(true);
  });

  it("keeps the fallback and warns when scene creation throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const onReady = vi.fn();
    mocks.create.mockImplementation(() => {
      throw new Error("context lost");
    });
    const { unmount } = mount({ onReady });

    intersect(true);
    await flush();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
    expect(() => unmount()).not.toThrow();
  });

  it("warns instead of crashing when loading rejects", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.load.mockRejectedValue(new Error("offline"));
    mount();

    intersect(true);
    await flush();

    expect(warn).toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("starts right away when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    mount();
    await flush();

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it("reports a lost context and disposes the scene", async () => {
    const onLost = vi.fn();
    mount({ onLost });
    intersect(true);
    await flush();

    act(() => mocks.create.mock.calls[0][1].onLost());

    expect(onLost).toHaveBeenCalledTimes(1);
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it("still reports a lost context when disposing the scene throws", async () => {
    const onLost = vi.fn();
    mocks.dispose.mockImplementation(() => {
      throw new Error("dispose failed");
    });
    mount({ onLost });
    intersect(true);
    await flush();

    expect(() => mocks.create.mock.calls[0][1].onLost()).toThrow("dispose failed");

    expect(onLost).toHaveBeenCalledTimes(1);
  });

  it("does not dispose twice when unmounting after a lost context", async () => {
    const { unmount } = mount();
    intersect(true);
    await flush();
    act(() => mocks.create.mock.calls[0][1].onLost());

    unmount();

    expect(mocks.dispose).toHaveBeenCalledTimes(1);
  });

  it("redraws once when the target fonts arrive after the timeout", async () => {
    mocks.awaitFonts.mockResolvedValueOnce(false).mockResolvedValue(true);
    mount();
    intersect(true);
    await flush();
    expect(mocks.redraw).not.toHaveBeenCalled();

    fontsTarget.dispatchEvent(new Event("loadingdone"));
    await flush();
    fontsTarget.dispatchEvent(new Event("loadingdone"));
    await flush();

    expect(mocks.redraw).toHaveBeenCalledTimes(1);
    expect(mocks.awaitFonts).toHaveBeenCalledTimes(2);
  });

  it("keeps waiting when a loadingdone batch does not include the target fonts", async () => {
    mocks.awaitFonts.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
    mount();
    intersect(true);
    await flush();

    fontsTarget.dispatchEvent(new Event("loadingdone"));
    await flush();
    expect(mocks.redraw).not.toHaveBeenCalled();

    fontsTarget.dispatchEvent(new Event("loadingdone"));
    await flush();
    expect(mocks.redraw).toHaveBeenCalledTimes(1);
  });

  it("does not redraw a scene that was disposed while fonts were being rechecked", async () => {
    let resolveFonts: (loaded: boolean) => void = () => undefined;
    mocks.awaitFonts.mockResolvedValueOnce(false).mockReturnValueOnce(new Promise<boolean>((r) => (resolveFonts = r)));
    const { unmount } = mount();
    intersect(true);
    await flush();
    fontsTarget.dispatchEvent(new Event("loadingdone"));
    unmount();

    resolveFonts(true);
    await flush();

    expect(mocks.redraw).not.toHaveBeenCalled();
  });

  it("does not subscribe to font events when fonts loaded in time", async () => {
    const add = vi.spyOn(fontsTarget, "addEventListener");
    mount();
    intersect(true);
    await flush();

    expect(add).not.toHaveBeenCalled();
  });

  it("removes the late-fonts listener on unmount", async () => {
    mocks.awaitFonts.mockResolvedValue(false);
    const { unmount } = mount();
    intersect(true);
    await flush();

    unmount();
    fontsTarget.dispatchEvent(new Event("loadingdone"));

    expect(mocks.redraw).not.toHaveBeenCalled();
  });
});
