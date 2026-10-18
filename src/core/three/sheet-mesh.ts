import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { Project } from "@/core/data/types/project";
import type { CanvasFonts } from "@/core/lib/canvas/fonts";
import { drawSheet } from "@/core/lib/canvas/sheet-face";
import { isCoarsePointer, sheetSize } from "@/core/lib/quality";
import { drawnTexture } from "./textures";

export const SHEET_WIDTH = 2.1;
export const SHEET_HEIGHT = 1.31;

export interface Sheet {
  readonly mesh: Mesh;
  redraw(): void;
}

export function createSheet(project: Project, image: HTMLImageElement | null, fonts: CanvasFonts, anisotropy: number): Sheet {
  const size = sheetSize(isCoarsePointer());
  const drawn = drawnTexture(size.width, size.height, anisotropy, (g) => drawSheet(g, project.link, image, fonts));
  const material = new MeshBasicMaterial({ map: drawn.texture, side: DoubleSide, transparent: true, alphaTest: 0.4 });
  const mesh = new Mesh(new PlaneGeometry(SHEET_WIDTH, SHEET_HEIGHT), material);
  return { mesh, redraw: drawn.redraw };
}
