import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { Disposers } from "./disposers";
import { createLoop } from "./loop";
import { observeContainer } from "./observe-container";

interface RuntimeOptions {
  readonly container: HTMLElement;
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly disposers: Disposers;
  readonly onResize: (width: number, height: number) => void;
  readonly update: (dt: number, seconds: number) => void;
  readonly onLost?: () => void;
  readonly onVisibilityChange?: (visible: boolean) => void;
  readonly frameInterval?: () => number;
}

export function startRuntime(o: RuntimeOptions): void {
  const { renderer, scene, camera, disposers } = o;
  let visible = true;
  const render = (): void => renderer.render(scene, camera);

  const loop = createLoop(
    (dt, seconds) => {
      o.update(dt, seconds);
      render();
    },
    { isActive: () => visible, frameInterval: o.frameInterval },
  );
  disposers.add(loop.stop);

  const canvas = renderer.domElement;
  const lost = (event: Event): void => {
    event.preventDefault();
    loop.stop();
    o.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", lost);
  disposers.add(() => canvas.removeEventListener("webglcontextlost", lost));

  const detach = observeContainer(o.container, {
    onResize: (width, height) => {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      o.onResize(width, height);
      camera.updateProjectionMatrix();
    },
    onVisibilityChange: (next) => {
      visible = next;
      loop.sync();
      o.onVisibilityChange?.(next);
    },
  });
  disposers.add(detach);

  o.update(0, 0);
  render();
  loop.sync();
}
