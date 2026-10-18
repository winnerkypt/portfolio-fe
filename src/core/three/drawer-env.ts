import { DirectionalLight, HemisphereLight, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShadowMaterial } from "three";
import { DRAWER_FOV } from "@/core/lib/drawer-layout";
import { isCoarsePointer, shadowMapSize } from "@/core/lib/quality";

// Light intensities are the original authored values times PI: three r155+ uses physically based units.
const LIGHT_UNIT = Math.PI;

export function createDrawerCamera(): PerspectiveCamera {
  return new PerspectiveCamera(DRAWER_FOV, 1, 0.1, 100);
}

export function createDrawerStage(coarse: boolean = isCoarsePointer()): Scene {
  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0xd9b48f, 0.95 * LIGHT_UNIT));

  const sun = new DirectionalLight(0xfff0dc, 0.55 * LIGHT_UNIT);
  sun.position.set(-3, 7, 6);
  sun.castShadow = true;
  const map = shadowMapSize(coarse);
  sun.shadow.mapSize.set(map.width, map.height);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 5, bottom: -5, near: 1, far: 30 });
  sun.shadow.radius = 5;
  scene.add(sun);

  const ground = new Mesh(new PlaneGeometry(60, 30), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return scene;
}
