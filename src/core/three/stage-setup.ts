import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  WebGLRenderer,
} from "three";
import { CAMERA_FOV } from "@/core/lib/framing";
import { isCoarsePointer } from "@/core/lib/quality";
import type { Disposers } from "./disposers";

// Light intensities are the original authored values times PI: three r155+ uses physically based units.
const LIGHT_UNIT = Math.PI;
const COARSE_DPR_CAP = 1.5;
const FINE_DPR_CAP = 2;

export function createRenderer(container: HTMLElement, disposers: Disposers): WebGLRenderer {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? COARSE_DPR_CAP : FINE_DPR_CAP));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  container.appendChild(renderer.domElement);
  disposers.add(() => {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  });
  return renderer;
}

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
  camera.position.set(0, 0, 8.2);
  return camera;
}

export function createStage(): Scene {
  const scene = new Scene();
  scene.add(new HemisphereLight(0xfff4e5, 0x4a2a1d, 0.95 * LIGHT_UNIT));

  const key = new DirectionalLight(0xfff0dc, 0.75 * LIGHT_UNIT);
  key.position.set(-1.2, 2.5, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  key.shadow.radius = 6;
  scene.add(key);

  const catcher = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.26 }));
  catcher.position.z = -0.55;
  catcher.receiveShadow = true;
  scene.add(catcher);
  return scene;
}
