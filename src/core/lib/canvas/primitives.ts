import { bodyFont, type CanvasFonts } from "./fonts";

export const palette = {
  cream: "#fff4e5",
  creamDeep: "#f6e1c0",
  sand: "#ffddab",
  brown: "#8a482d",
  pink: "#f08282",
  ink: "#2c1d16",
  moss: "#5f6b33",
  paper: "#fffaf2",
  blush: "#f6c7be",
  rose: "#b4473f",
} as const;

type Ctx = CanvasRenderingContext2D;

export function roundedRect(g: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function starPath(g: Ctx, cx: number, cy: number, radius: number, rotation: number): void {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = rotation + (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 ? radius * 0.45 : radius;
    g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  g.closePath();
}

export function gridPaper(g: Ctx, width: number, height: number, step: number, color: string): void {
  g.strokeStyle = color;
  g.lineWidth = 1;
  for (let x = 0; x <= width; x += step) {
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, height);
    g.stroke();
  }
  for (let y = 0; y <= height; y += step) {
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(width, y + 0.5);
    g.stroke();
  }
}

export function barcode(g: Ctx, x: number, y: number, w: number, h: number, seed: string, color: string): void {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  g.fillStyle = color;
  let cx = x;
  while (cx < x + w) {
    s = (s * 1103515245 + 12345) >>> 0;
    const barWidth = 2 + ((s >>> 16) % 5);
    if ((s >>> 8) % 3) g.fillRect(cx, y, barWidth, h);
    cx += barWidth + 2 + ((s >>> 20) % 3);
  }
}

export function spacedText(
  g: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  font: string,
  spacing: number,
  align: CanvasTextAlign = "left",
): void {
  g.fillStyle = color;
  g.font = font;
  g.textAlign = align;
  const spaceable = "letterSpacing" in g;
  if (spaceable) g.letterSpacing = `${spacing}px`;
  g.fillText(text, x, y);
  if (spaceable) g.letterSpacing = "0px";
  g.textAlign = "left";
}

export function pill(g: Ctx, text: string, x: number, y: number, bg: string, fg: string, fonts: CanvasFonts): number {
  g.font = bodyFont(24, fonts, 700);
  const width = g.measureText(text).width + 40;
  g.fillStyle = bg;
  roundedRect(g, x, y, width, 52, 26);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = palette.ink;
  g.stroke();
  g.fillStyle = fg;
  g.textBaseline = "middle";
  g.fillText(text, x + 20, y + 27);
  g.textBaseline = "alphabetic";
  return width;
}

export function stickerStar(g: Ctx, x: number, y: number, radius: number, rotation: number, fill: string): void {
  g.save();
  g.shadowColor = "rgba(44,29,22,0.25)";
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  starPath(g, x, y, radius, rotation);
  g.fillStyle = fill;
  g.fill();
  g.shadowColor = "transparent";
  g.lineWidth = 4;
  g.strokeStyle = palette.ink;
  g.stroke();
  g.restore();
}
