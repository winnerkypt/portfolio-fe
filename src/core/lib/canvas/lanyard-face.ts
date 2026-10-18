import type { BadgeData } from "./badge-data";
import { displayFont, type CanvasFonts } from "./fonts";
import { palette, starPath } from "./primitives";

export const LANYARD_SIZE = { width: 512, height: 64 } as const;

export function drawLanyard(g: CanvasRenderingContext2D, data: BadgeData, fonts: CanvasFonts): void {
  const { width } = LANYARD_SIZE;
  g.fillStyle = palette.brown;
  g.fillRect(0, 0, width, LANYARD_SIZE.height);
  g.fillStyle = palette.sand;
  g.fillRect(0, 5, width, 3);
  g.fillRect(0, 56, width, 3);
  g.font = displayFont(30, fonts);
  g.textBaseline = "middle";
  g.fillText(data.lanyard[0], 18, 34);
  g.fillText(data.lanyard[1], 222, 34);
  g.fillStyle = palette.pink;
  for (const cx of [196, 440]) {
    starPath(g, cx, 32, 11, 0);
    g.fill();
  }
  g.textBaseline = "alphabetic";
}
