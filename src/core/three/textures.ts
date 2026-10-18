import { CanvasTexture, SRGBColorSpace } from "three";

export interface DrawnTexture {
  readonly texture: CanvasTexture;
  redraw(): void;
}

export function drawnTexture(
  width: number,
  height: number,
  anisotropy: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): DrawnTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  draw(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return {
    texture,
    redraw() {
      ctx.clearRect(0, 0, width, height);
      draw(ctx);
      texture.needsUpdate = true;
    },
  };
}
