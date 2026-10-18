import { Plane, Raycaster, Vector2, Vector3, type Camera, type Object3D } from "three";
import { isTap, type PressPoint } from "@/core/lib/physics/badge-pose";
import type { Vec3 } from "@/core/lib/physics/rope";
import { rafThrottle } from "@/core/lib/raf-throttle";
import { listen } from "./listen";

export interface PointerHandlers {
  readonly getTip: () => Vec3;
  readonly onGrab: () => void;
  readonly onDrag: (target: Vec3) => void;
  readonly onRelease: (tapped: boolean) => void;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Control {
  readonly element: HTMLElement;
  readonly handlers: PointerHandlers;
  readonly raycaster: Raycaster;
  readonly plane: Plane;
  readonly hit: Vector3;
  readonly grabOffset: Vector3;
  readonly overCard: (x: number, y: number) => boolean;
  readonly aim: (x: number, y: number) => void;
  press: PressPoint | null;
}

function createControl(element: HTMLElement, camera: Camera, card: Object3D, handlers: PointerHandlers): Control {
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const aim = (x: number, y: number): void => {
    const rect = element.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
  };
  const overCard = (x: number, y: number): boolean => {
    aim(x, y);
    return raycaster.intersectObject(card, true).length > 0;
  };
  return {
    element,
    handlers,
    raycaster,
    plane: new Plane(new Vector3(0, 0, 1), 0),
    hit: new Vector3(),
    grabOffset: new Vector3(),
    overCard,
    aim,
    press: null,
  };
}

function finish(c: Control, tapped: boolean): void {
  c.press = null;
  c.element.style.cursor = "";
  c.handlers.onRelease(tapped);
}

function createDown(c: Control): (e: PointerEvent) => void {
  return (e) => {
    if (!c.overCard(e.clientX, e.clientY) || !c.raycaster.ray.intersectPlane(c.plane, c.hit)) return;
    const tip = c.handlers.getTip();
    c.grabOffset.set(tip[0] - c.hit.x, tip[1] - c.hit.y, tip[2] - c.hit.z);
    c.press = { x: e.clientX, y: e.clientY, t: performance.now() };
    c.element.setPointerCapture(e.pointerId);
    c.element.style.cursor = "grabbing";
    c.handlers.onGrab();
  };
}

function createDrag(c: Control, hover: (point: Point) => void): (e: PointerEvent) => void {
  return (e) => {
    if (!c.press) {
      hover({ x: e.clientX, y: e.clientY });
      return;
    }
    c.aim(e.clientX, e.clientY);
    if (!c.raycaster.ray.intersectPlane(c.plane, c.hit)) return;
    c.handlers.onDrag([c.hit.x + c.grabOffset.x, c.hit.y + c.grabOffset.y, c.hit.z + c.grabOffset.z]);
  };
}

function createUp(c: Control): (e: PointerEvent) => void {
  return (e) => {
    if (!c.press) return;
    const tapped = isTap(c.press, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (c.element.hasPointerCapture(e.pointerId)) c.element.releasePointerCapture(e.pointerId);
    finish(c, tapped);
  };
}

export function attachPointerControls(
  element: HTMLElement,
  camera: Camera,
  card: Object3D,
  handlers: PointerHandlers,
): () => void {
  const control = createControl(element, camera, card, handlers);
  const hover = rafThrottle<Point>(({ x, y }) => {
    if (!control.press) element.style.cursor = control.overCard(x, y) ? "grab" : "";
  });
  const abort = (): void => {
    if (control.press) finish(control, false);
  };
  const detach = listen(element, {
    pointerdown: createDown(control),
    pointermove: createDrag(control, (point) => hover.call(point)),
    pointerup: createUp(control),
    pointercancel: abort,
    lostpointercapture: abort,
  });
  return () => {
    hover.cancel();
    detach();
  };
}
