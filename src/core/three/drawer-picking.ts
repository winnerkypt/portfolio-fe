import { Raycaster, Vector2, type Camera, type Object3D } from "three";
import { rafThrottle } from "@/core/lib/raf-throttle";
import { listen } from "./listen";

export interface Pickable {
  readonly object: Object3D;
  readonly index: number;
}

export interface PickingHandlers {
  readonly onHover: (index: number) => void;
  readonly onPointer: (x: number) => void;
  readonly onSelect: (index: number) => void;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Press extends Point {
  readonly pointerId: number;
}

const CLICK_SLOP = 8;

function isShown(object: Object3D | null): boolean {
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  return true;
}

function createPicker(element: HTMLElement, camera: Camera, pickables: readonly Pickable[]): (point: Point) => number {
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const indexOf = new Map(pickables.map((p) => [p.object, p.index]));
  const live: Object3D[] = [];

  return ({ x, y }) => {
    const rect = element.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    live.length = 0;
    for (const { object } of pickables) if (isShown(object)) live.push(object);
    const hit = raycaster.intersectObjects(live, false)[0];
    return hit ? (indexOf.get(hit.object) ?? -1) : -1;
  };
}

function createPressHandlers(pick: (point: Point) => number, onSelect: (index: number) => void) {
  let press: Press | null = null;
  return {
    down: (e: PointerEvent): void => {
      if (!e.isPrimary || e.button !== 0) return;
      press = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    },
    up: (e: PointerEvent): void => {
      const start = press;
      if (!start || start.pointerId !== e.pointerId) return;
      press = null;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) >= CLICK_SLOP) return;
      const index = pick({ x: e.clientX, y: e.clientY });
      if (index >= 0) onSelect(index);
    },
    cancel: (): void => {
      press = null;
    },
  };
}

export function attachDrawerPicking(
  element: HTMLElement,
  camera: Camera,
  pickables: readonly Pickable[],
  handlers: PickingHandlers,
): () => void {
  const pick = createPicker(element, camera, pickables);
  const { down, up, cancel } = createPressHandlers(pick, handlers.onSelect);

  const hover = rafThrottle<Point>((point) => {
    const index = pick(point);
    element.style.cursor = index >= 0 ? "pointer" : "";
    handlers.onHover(index);
  });
  const move = (e: PointerEvent): void => {
    const rect = element.getBoundingClientRect();
    handlers.onPointer(((e.clientX - rect.left) / rect.width) * 2 - 1);
    hover.call({ x: e.clientX, y: e.clientY });
  };
  const leave = (): void => {
    hover.cancel();
    element.style.cursor = "";
    handlers.onHover(-1);
    handlers.onPointer(0);
  };

  const detach = listen(element, { pointermove: move, pointerdown: down, pointerup: up, pointercancel: cancel, pointerleave: leave });
  return () => {
    hover.cancel();
    detach();
  };
}
