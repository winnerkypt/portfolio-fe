import { bodyFont, displayFont, type CanvasFonts } from "./fonts";
import { palette, roundedRect, starPath } from "./primitives";

export interface FolderLook {
  readonly color: string;
  readonly dot: string;
  readonly star: string;
  readonly ink?: string;
}

export interface FaceSize {
  readonly width: number;
  readonly height: number;
}

type Ctx = CanvasRenderingContext2D;

export const BACK_SIZE: FaceSize = { width: 512, height: 356 };
export const FRONT_SIZE: FaceSize = { width: 512, height: 330 };
export const TAB_SIZE: FaceSize = { width: 400, height: 130 };

export const FOLDER_LOOKS: readonly FolderLook[] = [
  { color: palette.brown, dot: palette.sand, star: palette.pink },
  { color: palette.pink, dot: palette.brown, star: palette.sand, ink: palette.rose },
  { color: palette.moss, dot: palette.cream, star: palette.sand },
  { color: palette.sand, dot: palette.brown, star: palette.pink, ink: palette.brown },
  { color: "#c4673f", dot: palette.cream, star: palette.sand },
];

export function folderLook(index: number): FolderLook {
  return FOLDER_LOOKS[index % FOLDER_LOOKS.length];
}

const pad = (n: number): string => String(n).padStart(2, "0");

function paintBody(g: Ctx, { width, height }: FaceSize, look: FolderLook, shaded: boolean): void {
  g.clearRect(0, 0, width, height);
  g.save();
  roundedRect(g, 2, 2, width - 4, height - 4, 34);
  g.clip();
  g.fillStyle = look.color;
  g.fillRect(0, 0, width, height);
  if (shaded) {
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(0, 0, width, height);
  }
  g.fillStyle = look.dot;
  g.globalAlpha = 0.24;
  for (let y = 18; y < height; y += 34) {
    for (let x = (y / 34) % 2 ? 34 : 17; x < width; x += 34) {
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  const sheen = g.createLinearGradient(0, 0, 0, height);
  sheen.addColorStop(0, "rgba(255,255,255,0.18)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.10)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, width, height);
  g.restore();
}

function paintLabel(g: Ctx, size: FaceSize, look: FolderLook, text: string, index: number, fonts: CanvasFonts): void {
  g.save();
  g.translate(size.width / 2, size.height * 0.58);
  g.rotate(side(index) * 0.05);
  g.fillStyle = "rgba(44,29,22,0.18)";
  roundedRect(g, -128, -42, 262, 92, 14);
  g.fill();
  g.fillStyle = palette.paper;
  roundedRect(g, -132, -48, 262, 92, 14);
  g.fill();
  g.fillStyle = look.ink ?? look.color;
  g.font = displayFont(58, fonts);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, -1, 0);
  g.restore();
}

function side(index: number): number {
  return index % 2 ? 1 : -1;
}

function paintSticker(g: Ctx, size: FaceSize, look: FolderLook): void {
  g.save();
  g.translate(size.width - 70, 70);
  g.rotate(0.3);
  g.fillStyle = look.star;
  starPath(g, 0, 0, 30, 0);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = palette.ink;
  g.stroke();
  g.restore();
}

export function drawFolderBack(g: Ctx, size: FaceSize, look: FolderLook): void {
  paintBody(g, size, look, true);
}

export function drawFolderFront(g: Ctx, size: FaceSize, look: FolderLook, index: number, total: number, fonts: CanvasFonts): void {
  paintBody(g, size, look, false);
  g.setLineDash([12, 10]);
  g.lineWidth = 3;
  g.strokeStyle = look.dot;
  g.globalAlpha = 0.55;
  roundedRect(g, 18, 18, size.width - 36, size.height - 36, 22);
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
  paintLabel(g, size, look, `${pad(index + 1)} / ${pad(total)}`, index, fonts);
  paintSticker(g, size, look);
}

export function drawFolderTab(g: Ctx, { width, height }: FaceSize, look: FolderLook, text: string, fonts: CanvasFonts): void {
  g.clearRect(0, 0, width, height);
  g.fillStyle = look.color;
  g.beginPath();
  g.moveTo(0, height);
  g.lineTo(26, 6);
  g.quadraticCurveTo(30, 0, 40, 0);
  g.lineTo(width - 40, 0);
  g.quadraticCurveTo(width - 30, 0, width - 26, 6);
  g.lineTo(width, height);
  g.closePath();
  g.fill();
  g.fillStyle = palette.paper;
  roundedRect(g, 44, 22, width - 88, height - 36, 6);
  g.fill();
  g.fillStyle = palette.ink;
  g.font = bodyFont(46, fonts, 700);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, width / 2, 22 + (height - 36) / 2 + 2);
}
