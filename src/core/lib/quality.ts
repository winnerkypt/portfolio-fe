export const IDLE_FRAME_MS = 1000 / 30;

const FRAME_SLACK_MS = 2;

export function isCoarsePointer(): boolean {
  return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
}

export function sheetSize(coarse: boolean): { readonly width: number; readonly height: number } {
  return coarse ? { width: 640, height: 400 } : { width: 1280, height: 800 };
}

export function shadowMapSize(coarse: boolean): { readonly width: number; readonly height: number } {
  return coarse ? { width: 1024, height: 512 } : { width: 2048, height: 1024 };
}

export function shouldRenderFrame(now: number, lastRender: number, intervalMs: number): boolean {
  return intervalMs <= 0 || now - lastRender >= intervalMs - FRAME_SLACK_MS;
}
