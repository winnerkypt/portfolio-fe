import { hostOf } from "@/core/lib/host-of";
import { bodyFont, type CanvasFonts } from "./fonts";
import { palette, roundedRect } from "./primitives";

export const SHEET_SIZE = { width: 1280, height: 800 } as const;

const RADIUS = 30;
const BAR = 64;
const PAD = 16;
const DOTS = [palette.pink, palette.sand, palette.moss];

type Ctx = CanvasRenderingContext2D;

function paintPaper(g: Ctx, width: number, height: number): void {
  g.fillStyle = "rgba(44,29,22,0.22)";
  roundedRect(g, 10, 14, width - 16, height - 18, RADIUS);
  g.fill();
  g.fillStyle = palette.paper;
  roundedRect(g, 4, 4, width - 16, height - 18, RADIUS);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = "rgba(44,29,22,0.16)";
  g.stroke();
}

function paintBar(g: Ctx, width: number, host: string, fonts: CanvasFonts): void {
  DOTS.forEach((color, k) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(44 + k * 34, 4 + BAR / 2, 10, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = palette.cream;
  roundedRect(g, 170, 18, width - 360, BAR - 28, 18);
  g.fill();
  g.fillStyle = "rgba(44,29,22,0.6)";
  g.font = bodyFont(24, fonts, 500);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(host, 170 + (width - 360) / 2, 4 + BAR / 2 + 1);
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
}

function paintShot(g: Ctx, width: number, height: number, image: HTMLImageElement | null): void {
  const x = 4 + PAD;
  const y = 4 + BAR;
  const w = width - 16 - PAD * 2;
  const h = height - 18 - BAR - PAD;
  g.save();
  roundedRect(g, x, y, w, h, 16);
  g.clip();
  if (image) {
    const scale = Math.max(w / image.width, h / image.height);
    const sw = w / scale;
    const sh = h / scale;
    g.drawImage(image, (image.width - sw) / 2, 0, sw, sh, x, y, w, h);
  } else {
    g.fillStyle = palette.cream;
    g.fillRect(x, y, w, h);
  }
  g.restore();
}

function paintTape(g: Ctx, width: number): void {
  g.save();
  g.translate(width / 2, 10);
  g.rotate(-0.04);
  g.fillStyle = "rgba(255,221,171,0.85)";
  g.fillRect(-90, -16, 180, 40);
  g.restore();
}

export function drawSheet(g: Ctx, link: string, image: HTMLImageElement | null, fonts: CanvasFonts): void {
  const { width, height } = SHEET_SIZE;
  const scale = g.canvas.width / width;
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  g.save();
  if (scale !== 1) g.scale(scale, scale);
  paintPaper(g, width, height);
  paintBar(g, width, hostOf(link), fonts);
  paintShot(g, width, height, image);
  paintTape(g, width);
  g.restore();
}
