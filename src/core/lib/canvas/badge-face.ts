import type { BadgeData } from "./badge-data";
import { bodyFont, displayFont, type CanvasFonts } from "./fonts";
import { barcode, gridPaper, palette, pill, roundedRect, spacedText, stickerStar } from "./primitives";

export const BADGE_SIZE = { width: 1200, height: 760 } as const;

const PHOTO_CROP = { x: 132 / 560, y: 8 / 499, w: 397 / 560, h: 482 / 499 } as const;
const LEFT = 78;

type Ctx = CanvasRenderingContext2D;

export interface BadgeImages {
  readonly photo: HTMLImageElement | null;
}

function frame(g: Ctx, background: string, lines: string, border: string): void {
  const { width, height } = BADGE_SIZE;
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillStyle = background;
  g.fillRect(0, 0, width, height);
  gridPaper(g, width, height, 40, lines);
  g.lineWidth = 3;
  g.strokeStyle = border;
  roundedRect(g, 26, 26, width - 52, height - 52, 26);
  g.stroke();
}

function drawPhoto(g: Ctx, photo: HTMLImageElement | null): void {
  g.save();
  g.translate(942, 326);
  g.rotate(0.03);
  g.shadowColor = "rgba(44,29,22,0.28)";
  g.shadowBlur = 18;
  g.shadowOffsetY = 8;
  g.fillStyle = "#ffffff";
  roundedRect(g, -180, -216, 360, 432, 16);
  g.fill();
  g.shadowColor = "transparent";
  g.save();
  roundedRect(g, -168, -204, 336, 408, 10);
  g.clip();
  if (photo) {
    const { naturalWidth: iw, naturalHeight: ih } = photo;
    g.imageSmoothingQuality = "high";
    g.drawImage(photo, PHOTO_CROP.x * iw, PHOTO_CROP.y * ih, PHOTO_CROP.w * iw, PHOTO_CROP.h * ih, -168, -204, 336, 408);
  } else {
    g.fillStyle = palette.creamDeep;
    g.fillRect(-168, -204, 336, 408);
  }
  g.restore();
  g.fillStyle = "rgba(240,130,130,0.82)";
  g.save();
  g.translate(0, -214);
  g.rotate(-0.06);
  g.fillRect(-64, -16, 128, 32);
  g.restore();
  g.restore();
}

function drawTitle(g: Ctx, data: BadgeData, fonts: CanvasFonts): void {
  g.fillStyle = palette.brown;
  g.font = displayFont(118, fonts);
  data.titleLines.forEach((line, i) => g.fillText(line, LEFT, 232 + i * 120));
  g.fillStyle = palette.pink;
  g.font = displayFont(84, fonts);
  g.fillText(data.accent, LEFT, 448);
  g.fillStyle = palette.ink;
  g.font = bodyFont(42, fonts, 700);
  g.fillText(data.fullName, LEFT, 528);
  spacedText(g, data.tagline, LEFT, 574, palette.moss, bodyFont(20, fonts, 700), 4);
  const x = LEFT + pill(g, data.location, LEFT, 604, palette.sand, palette.brown, fonts) + 12;
  pill(g, data.status, x, 604, palette.moss, palette.cream, fonts);
}

function drawBarcodeBlock(g: Ctx, data: BadgeData, fonts: CanvasFonts): void {
  g.fillStyle = "#ffffff";
  roundedRect(g, 790, 572, 304, 72, 8);
  g.fill();
  barcode(g, 802, 582, 280, 52, data.barcodeSeed, palette.ink);
  g.fillStyle = "rgba(44,29,22,0.65)";
  g.font = bodyFont(20, fonts, 500);
  g.textAlign = "center";
  g.fillText(data.github, 942, 676);
  g.textAlign = "left";
}

export function drawBadgeFront(g: Ctx, data: BadgeData, fonts: CanvasFonts, images: BadgeImages): void {
  frame(g, palette.paper, "rgba(138,72,45,0.07)", "rgba(138,72,45,0.5)");
  drawTitle(g, data, fonts);
  drawPhoto(g, images.photo);
  stickerStar(g, 786, 520, 40, 0.2, palette.sand);
  drawBarcodeBlock(g, data, fonts);
}

function drawStickyNote(g: Ctx, data: BadgeData, fonts: CanvasFonts): void {
  const { back } = data;
  g.save();
  g.translate(330, 330);
  g.rotate(-0.05);
  g.shadowColor = "rgba(44,29,22,0.25)";
  g.shadowBlur = 16;
  g.shadowOffsetY = 8;
  g.fillStyle = palette.sand;
  g.fillRect(-250, -170, 500, 340);
  g.shadowColor = "transparent";
  g.fillStyle = "rgba(95,107,51,0.6)";
  g.fillRect(-70, -188, 140, 34);
  spacedText(g, back.eyebrow, 0, -88, palette.brown, bodyFont(22, fonts, 700), 5, "center");
  g.textAlign = "center";
  g.fillStyle = palette.brown;
  g.font = displayFont(104, fonts);
  g.fillText(back.headline, 0, 20, 440);
  g.fillStyle = palette.rose;
  g.font = displayFont(64, fonts);
  g.fillText(back.sub, 0, 96);
  g.restore();
  g.textAlign = "left";
}

function drawContactCard(g: Ctx, data: BadgeData, fonts: CanvasFonts, x: number, w: number): void {
  const { back } = data;
  g.save();
  g.shadowColor = "rgba(44,29,22,0.22)";
  g.shadowBlur = 14;
  g.shadowOffsetY = 6;
  g.fillStyle = palette.paper;
  roundedRect(g, x, 110, w, 210, 22);
  g.fill();
  g.restore();
  g.lineWidth = 3;
  g.strokeStyle = palette.ink;
  roundedRect(g, x, 110, w, 210, 22);
  g.stroke();
  spacedText(g, back.returnTo, x + 28, 162, palette.moss, bodyFont(18, fonts, 700), 4);
  g.fillStyle = palette.ink;
  g.font = bodyFont(27, fonts, 700);
  g.fillText(back.email, x + 28, 214);
  g.fillStyle = "rgba(44,29,22,0.7)";
  g.font = bodyFont(28, fonts);
  g.fillText(back.phone, x + 28, 262);
  g.font = bodyFont(22, fonts, 500);
  g.fillText(data.github, x + 28, 298);
}

function drawStack(g: Ctx, data: BadgeData, fonts: CanvasFonts, x0: number, w: number): void {
  spacedText(g, data.back.stackLabel, x0, 386, palette.ink, bodyFont(20, fonts, 700), 5);
  let x = x0;
  let y = 404;
  data.back.stack.forEach((label, i) => {
    g.font = bodyFont(24, fonts, 700);
    const chipWidth = g.measureText(label).width + 40;
    if (x + chipWidth > x0 + w) {
      x = x0;
      y += 64;
    }
    pill(g, label, x, y, i % 2 ? palette.sand : palette.paper, palette.ink, fonts);
    x += chipWidth + 12;
  });
}

function drawStamp(g: Ctx, data: BadgeData, fonts: CanvasFonts): void {
  g.save();
  g.translate(1010, 600);
  g.rotate(-0.22);
  g.lineWidth = 5;
  g.strokeStyle = palette.brown;
  g.beginPath();
  g.arc(0, 0, 80, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([8, 7]);
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 66, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = palette.brown;
  g.textAlign = "center";
  g.font = displayFont(38, fonts);
  data.back.stamp.forEach((line, i) => g.fillText(line, 0, -4 + i * 38));
  g.restore();
  g.textAlign = "left";
}

export function drawBadgeBack(g: Ctx, data: BadgeData, fonts: CanvasFonts): void {
  frame(g, palette.blush, "rgba(255,244,229,0.6)", "rgba(138,72,45,0.45)");
  drawStickyNote(g, data, fonts);
  drawContactCard(g, data, fonts, 690, 440);
  drawStack(g, data, fonts, 690, 440);
  drawStamp(g, data, fonts);
  stickerStar(g, 120, 640, 30, 0.2, palette.cream);
}
