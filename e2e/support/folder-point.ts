import { PerspectiveCamera, Vector3 } from "three";
import {
  CAMERA_HEIGHT,
  CAMERA_PARALLAX,
  DRAWER_FOV,
  LOOK_AT,
  drawerLayout,
  folderRestPoint,
} from "../../src/core/lib/drawer-layout";

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const PARALLAX_PASSES = 3;

export function folderScreenPoint(box: Box, index: number, selected: number, count: number): { x: number; y: number } {
  const aspect = box.width / box.height;
  const layout = drawerLayout(count, aspect);
  const [wx, wy, wz] = folderRestPoint(index, selected, count, layout.narrow);
  const camera = new PerspectiveCamera(DRAWER_FOV, aspect, 0.1, 100);
  const point = new Vector3(wx, wy, wz);
  let ndcX = 0;
  for (let pass = 0; pass < PARALLAX_PASSES; pass++) {
    camera.position.set(ndcX * CAMERA_PARALLAX, CAMERA_HEIGHT, layout.distance);
    camera.lookAt(...LOOK_AT);
    camera.updateMatrixWorld();
    ndcX = point.clone().project(camera).x;
  }
  const ndc = point.clone().project(camera);
  return { x: box.x + ((ndc.x + 1) / 2) * box.width, y: box.y + ((1 - ndc.y) / 2) * box.height };
}
