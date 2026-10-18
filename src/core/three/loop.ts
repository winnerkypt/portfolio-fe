import { shouldRenderFrame } from "@/core/lib/quality";

export interface Loop {
  sync(): void;
  stop(): void;
}

interface LoopOptions {
  readonly isActive: () => boolean;
  readonly frameInterval?: () => number;
}

const MAX_FRAME = 1 / 30;

export function createLoop(renderFrame: (dt: number, seconds: number) => void, { isActive, frameInterval }: LoopOptions): Loop {
  let frame = 0;
  let last = 0;
  let stopped = false;

  const tick = (now: number): void => {
    frame = 0;
    if (stopped || !isActive()) return;
    if (shouldRenderFrame(now, last, frameInterval?.() ?? 0)) {
      const dt = Math.min(Math.max((now - last) / 1000, 0), MAX_FRAME);
      last = now;
      renderFrame(dt, now / 1000);
    }
    if (!stopped) frame = requestAnimationFrame(tick);
  };

  return {
    sync() {
      if (stopped || frame || !isActive()) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
