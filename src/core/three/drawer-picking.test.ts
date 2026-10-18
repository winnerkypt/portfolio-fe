import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry } from "three";
import { attachDrawerPicking } from "./drawer-picking";

let queue: FrameRequestCallback[];
let element: HTMLElement;
let onHover: ReturnType<typeof vi.fn>;
let onPointer: ReturnType<typeof vi.fn>;
let onSelect: ReturnType<typeof vi.fn>;
let detach: () => void;
let pickables: { object: Mesh; index: number }[];

function fire(type: string, x: number, y: number, init: PointerEventInit = {}): void {
  element.dispatchEvent(
    new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true, button: 0, ...init }),
  );
}

function plane(x: number): Mesh {
  const mesh = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
  mesh.position.x = x;
  mesh.updateMatrixWorld();
  return mesh;
}

beforeEach(() => {
  queue = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {
    queue = [];
  });
  element = document.createElement("div");
  element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 8;
  camera.updateMatrixWorld();
  onHover = vi.fn();
  onPointer = vi.fn();
  onSelect = vi.fn();
  pickables = [
    { object: plane(-1.5), index: 0 },
    { object: plane(1.5), index: 1 },
  ];
  detach = attachDrawerPicking(element, camera, pickables, { onHover, onPointer, onSelect });
});

afterEach(() => {
  detach();
  vi.unstubAllGlobals();
});

describe("attachDrawerPicking", () => {
  it("selects the folder under a tap", () => {
    fire("pointerdown", 48, 100);
    fire("pointerup", 48, 100);
    fire("pointerdown", 152, 100);
    fire("pointerup", 152, 100);

    expect(onSelect.mock.calls).toEqual([[0], [1]]);
  });

  it("ignores taps on empty space", () => {
    fire("pointerdown", 100, 100);
    fire("pointerup", 100, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("treats a drag past the slop as a scroll, not a click", () => {
    fire("pointerdown", 48, 100);
    fire("pointerup", 48, 140);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not select when the gesture is cancelled", () => {
    fire("pointerdown", 48, 100);
    fire("pointercancel", 48, 100);
    fire("pointerup", 48, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("reports hover once per frame and sets the pointer cursor", () => {
    fire("pointermove", 40, 100);
    fire("pointermove", 48, 100);
    expect(onHover).not.toHaveBeenCalled();

    queue.splice(0).forEach((cb) => cb(0));

    expect(onHover).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenCalledWith(0);
    expect(element.style.cursor).toBe("pointer");
  });

  it("reports the pointer position across the stage", () => {
    fire("pointermove", 150, 100);

    expect(onPointer).toHaveBeenCalledWith(0.5);
  });

  it("clears hover and pointer when leaving", () => {
    fire("pointermove", 48, 100);
    queue.splice(0).forEach((cb) => cb(0));

    fire("pointerleave", 48, 100);

    expect(onHover).toHaveBeenLastCalledWith(-1);
    expect(onPointer).toHaveBeenLastCalledWith(0);
    expect(element.style.cursor).toBe("");
  });

  it("stops listening after detach", () => {
    detach();
    fire("pointerdown", 48, 100);
    fire("pointerup", 48, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ignores a press from a non-primary pointer", () => {
    fire("pointerdown", 48, 100, { isPrimary: false });
    fire("pointerup", 48, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ignores presses from buttons other than the main one", () => {
    fire("pointerdown", 48, 100, { button: 2 });
    fire("pointerup", 48, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ignores a release from a different pointer than the press", () => {
    fire("pointerdown", 48, 100, { pointerId: 1 });
    fire("pointerup", 48, 100, { pointerId: 2 });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not pick folders that are hidden", () => {
    pickables[0].object.visible = false;
    fire("pointerdown", 48, 100);
    fire("pointerup", 48, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not pick children of a hidden folder group", () => {
    const group = new Group();
    group.add(pickables[1].object);
    group.visible = false;
    group.updateMatrixWorld(true);
    fire("pointerdown", 152, 100);
    fire("pointerup", 152, 100);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
