import { prefersReducedMotion } from "./motion";
import { smoothVelocity } from "./scroll-velocity";

export interface ScrollSample {
  readonly scrollY: number;
  readonly velocity: number;
}

export type ScrollListener = (sample: ScrollSample) => void;

export interface ScrollMotion {
  subscribe(listener: ScrollListener): () => void;
}

const ASSUMED_FRAME_MS = 1000 / 60;

export function createScrollMotion(): ScrollMotion {
  const listeners = new Set<ScrollListener>();
  let frame = 0;
  let lastY = 0;
  let lastTime: number | null = null;
  let velocity = 0;

  const tick = (now: number): void => {
    frame = 0;
    const y = window.scrollY;
    const dt = lastTime === null ? ASSUMED_FRAME_MS : now - lastTime;
    const instant = dt > 0 ? ((y - lastY) / dt) * 1000 : 0;
    velocity = smoothVelocity(velocity, instant, dt);
    lastY = y;
    lastTime = now;
    const sample: ScrollSample = { scrollY: y, velocity };
    for (const listener of [...listeners]) listener(sample);
    if (velocity !== 0 && listeners.size) schedule();
    else lastTime = null;
  };

  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const attach = (): void => {
    lastY = window.scrollY;
    lastTime = null;
    velocity = 0;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  };

  const detach = (): void => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    frame = 0;
  };

  return {
    subscribe(listener) {
      if (prefersReducedMotion()) return () => undefined;
      if (!listeners.size) attach();
      listeners.add(listener);
      return () => {
        if (!listeners.delete(listener) || listeners.size) return;
        detach();
      };
    },
  };
}

export const scrollMotion = createScrollMotion();
