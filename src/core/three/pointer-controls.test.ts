import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from "three";
import { attachPointerControls, type PointerHandlers } from "./pointer-controls";

let queue: FrameRequestCallback[];
let element: HTMLElement;
let handlers: { [K in keyof PointerHandlers]: ReturnType<typeof vi.fn> };
let detach: () => void;
const captured = new Set<number>();

function fire(type: string, x: number, y: number): void {
  const event = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
  Object.defineProperty(event, "pointerId", { value: 1 });
  element.dispatchEvent(event);
}

function flushFrames(): void {
  queue.splice(0).forEach((cb) => cb(0));
}

beforeEach(() => {
  queue = [];
  captured.clear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {
    queue = [];
  });
  vi.spyOn(performance, "now").mockReturnValue(100);
  element = document.createElement("div");
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;
  element.setPointerCapture = (id: number) => void captured.add(id);
  element.hasPointerCapture = (id: number) => captured.has(id);
  element.releasePointerCapture = (id: number) => void captured.delete(id);
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 8;
  camera.updateMatrixWorld();
  const card = new Mesh(new PlaneGeometry(3, 3), new MeshBasicMaterial());
  card.updateMatrixWorld();
  handlers = { getTip: vi.fn(() => [0, 0, 0]), onGrab: vi.fn(), onDrag: vi.fn(), onRelease: vi.fn() };
  detach = attachPointerControls(element, camera, card, handlers as unknown as PointerHandlers);
});

afterEach(() => {
  detach();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("attachPointerControls", () => {
  it("grabs only when pressing the card", () => {
    fire("pointerdown", 2, 2);
    expect(handlers.onGrab).not.toHaveBeenCalled();

    fire("pointerdown", 100, 100);
    expect(handlers.onGrab).toHaveBeenCalledTimes(1);
  });

  it("reports a tap on a quick release and clears capture", () => {
    fire("pointerdown", 100, 100);
    fire("pointerup", 100, 100);

    expect(handlers.onRelease).toHaveBeenCalledWith(true);
    expect(captured.size).toBe(0);
  });

  it("releases without a tap when pointer capture is lost", () => {
    fire("pointerdown", 100, 100);
    fire("lostpointercapture", 100, 100);
    fire("pointerup", 100, 100);

    expect(handlers.onRelease).toHaveBeenCalledTimes(1);
    expect(handlers.onRelease).toHaveBeenCalledWith(false);
  });

  it("drags while pressed", () => {
    fire("pointerdown", 100, 100);
    fire("pointermove", 120, 100);

    expect(handlers.onDrag).toHaveBeenCalledTimes(1);
  });

  it("throttles hover raycasts to one per frame", () => {
    fire("pointermove", 100, 100);
    fire("pointermove", 101, 100);
    fire("pointermove", 102, 100);
    expect(element.style.cursor).toBe("");

    flushFrames();

    expect(element.style.cursor).toBe("grab");
  });

  it("removes every listener on detach", () => {
    detach();
    fire("pointerdown", 100, 100);

    expect(handlers.onGrab).not.toHaveBeenCalled();
  });
});
