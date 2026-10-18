import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeContainer } from "./observe-container";

let resizeCb: ResizeObserverCallback;
let intersectCb: IntersectionObserverCallback;
const resizeDisconnect = vi.fn();
const intersectDisconnect = vi.fn();

beforeEach(() => {
  resizeDisconnect.mockReset();
  intersectDisconnect.mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: ResizeObserverCallback) {
        resizeCb = cb;
      }
      observe = vi.fn();
      disconnect = resizeDisconnect;
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback) {
        intersectCb = cb;
      }
      observe = vi.fn();
      disconnect = intersectDisconnect;
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function container(width: number, height: number): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { value: width, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: height, configurable: true });
  return el;
}

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("observeContainer", () => {
  it("reports the size immediately and on resize", () => {
    const onResize = vi.fn();
    observeContainer(container(300, 200), { onResize, onVisibilityChange: vi.fn() });

    expect(onResize).toHaveBeenCalledWith(300, 200);
    resizeCb([], {} as ResizeObserver);
    expect(onResize).toHaveBeenCalledTimes(2);
  });

  it("reports intersection changes as visibility", () => {
    const onVisibilityChange = vi.fn();
    observeContainer(container(1, 1), { onResize: vi.fn(), onVisibilityChange });

    intersectCb([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    intersectCb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    expect(onVisibilityChange.mock.calls).toEqual([[false], [true]]);
  });

  it("treats a hidden document as not visible and restores on show", () => {
    const onVisibilityChange = vi.fn();
    const detach = observeContainer(container(1, 1), { onResize: vi.fn(), onVisibilityChange });

    setHidden(true);
    setHidden(false);
    detach();

    expect(onVisibilityChange.mock.calls).toEqual([[false], [true]]);
  });

  it("detaches every listener", () => {
    const onVisibilityChange = vi.fn();
    const detach = observeContainer(container(1, 1), { onResize: vi.fn(), onVisibilityChange });

    detach();
    setHidden(true);
    setHidden(false);

    expect(resizeDisconnect).toHaveBeenCalled();
    expect(intersectDisconnect).toHaveBeenCalled();
    expect(onVisibilityChange).not.toHaveBeenCalled();
  });
});
