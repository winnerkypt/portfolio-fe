import { DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type Texture } from "three";
import type { Project } from "@/core/data/types/project";
import type { CanvasFonts } from "@/core/lib/canvas/fonts";
import {
  BACK_SIZE,
  FRONT_SIZE,
  TAB_SIZE,
  drawFolderBack,
  drawFolderFront,
  drawFolderTab,
  folderLook,
} from "@/core/lib/canvas/folder-face";
import { createSheet } from "./sheet-mesh";
import { drawnTexture } from "./textures";

export const FOLDER_WIDTH = 2.3;
export const FOLDER_HEIGHT = 1.6;
const TAB = { width: 0.95, height: 0.3 };
const FRONT_INSET = 0.1;
const SHEET_REST_Y = 0.8;

export interface Folder {
  readonly group: Group;
  readonly hinge: Group;
  readonly sheet: Mesh;
  readonly pickables: readonly Mesh[];
  redraw(): void;
}

interface FolderSource {
  readonly index: number;
  readonly count: number;
  readonly project: Project;
  readonly image: HTMLImageElement | null;
  readonly fonts: CanvasFonts;
  readonly anisotropy: number;
}

function bowed(width: number, height: number, bow: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, height, 16, 4);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) / (width / 2);
    position.setZ(i, (1 - x * x) * bow);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function paper(map: Texture): MeshStandardMaterial {
  return new MeshStandardMaterial({ map, roughness: 0.78, side: DoubleSide, transparent: true, alphaTest: 0.5 });
}

export function createFolder(source: FolderSource): Folder {
  const { index, count, project, fonts, anisotropy } = source;
  const look = folderLook(index);
  const back = drawnTexture(BACK_SIZE.width, BACK_SIZE.height, anisotropy, (g) => drawFolderBack(g, BACK_SIZE, look));
  const tabFace = drawnTexture(TAB_SIZE.width, TAB_SIZE.height, anisotropy, (g) => drawFolderTab(g, TAB_SIZE, look, project.tab, fonts));
  const frontFace = drawnTexture(FRONT_SIZE.width, FRONT_SIZE.height, anisotropy, (g) =>
    drawFolderFront(g, FRONT_SIZE, look, index, count, fonts),
  );
  const sheet = createSheet(project, source.image, fonts, anisotropy);

  const backMesh = new Mesh(bowed(FOLDER_WIDTH, FOLDER_HEIGHT, -0.04), paper(back.texture));
  backMesh.position.y = FOLDER_HEIGHT / 2;
  const tab = new Mesh(new PlaneGeometry(TAB.width, TAB.height), paper(tabFace.texture));
  const tabX = FOLDER_WIDTH / 2 - TAB.width / 2 - 0.12;
  tab.position.set(index % 2 ? tabX : -tabX, FOLDER_HEIGHT + TAB.height / 2 - 0.005, 0);
  sheet.mesh.position.set(0, SHEET_REST_Y, 0.025);
  const front = new Mesh(bowed(FOLDER_WIDTH, FOLDER_HEIGHT - FRONT_INSET, 0.07), paper(frontFace.texture));
  front.position.y = (FOLDER_HEIGHT - FRONT_INSET) / 2;
  const hinge = new Group();
  hinge.position.z = 0.05;
  hinge.add(front);

  const pickables = [backMesh, tab, sheet.mesh, front];
  pickables.forEach((mesh) => {
    mesh.castShadow = true;
  });
  const group = new Group();
  group.add(backMesh, tab, sheet.mesh, hinge);
  const faces = [back, tabFace, frontFace, sheet];
  return { group, hinge, sheet: sheet.mesh, pickables, redraw: () => faces.forEach((face) => face.redraw()) };
}
