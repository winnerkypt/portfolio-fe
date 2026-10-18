import type { PerspectiveCamera } from "three";
import type { BadgeImages } from "@/core/lib/canvas/badge-face";
import type { CanvasFonts } from "@/core/lib/canvas/fonts";
import { computeFraming, isWideViewport } from "@/core/lib/framing";
import { scrollMotion } from "@/core/lib/scroll-motion";
import { createRopeSim, type RopeSim } from "@/core/lib/physics/rope-sim";
import { buildBadgeAssets, type BadgeAssets } from "./badge-assets";
import { CARD_HEIGHT } from "./card-mesh";
import { disposeTree } from "./dispose";
import { buildGuarded } from "./disposers";
import { attachPointerControls } from "./pointer-controls";
import { startRuntime } from "./scene-runtime";
import { createCamera, createRenderer, createStage } from "./stage-setup";

export interface BadgeSceneOptions {
  readonly fonts: CanvasFonts;
  readonly images: BadgeImages;
  readonly reducedMotion: boolean;
  readonly onLost?: () => void;
  readonly onFlip?: (flipped: boolean) => void;
}

export interface BadgeSceneHandle {
  dispose(): void;
  redraw(): void;
}

const OFFSETS = { clip: 0.05, card: 0.16 + CARD_HEIGHT / 2 };

function place(sim: RopeSim, assets: BadgeAssets, anchorX: number, anchorY: number): void {
  const { clip, card, lanyard } = assets;
  const pose = sim.pose(OFFSETS);
  const angle = sim.spinAngle();
  clip.position.set(...pose.clip);
  clip.rotation.set(0, angle, pose.angleZ);
  card.position.set(...pose.card);
  card.rotation.set(0, angle, pose.angleZ);
  lanyard.update(anchorX, anchorY, sim.buffers.positions);
}

function reportSwing(container: HTMLElement, angleZ: number, last: { value: string }): void {
  const degrees = ((angleZ * 180) / Math.PI).toFixed(1);
  if (degrees === last.value) return;
  last.value = degrees;
  container.dataset.swing = degrees;
}

function frame(camera: PerspectiveCamera, sim: RopeSim, assets: BadgeAssets, width: number, height: number): [number, number] {
  const framing = computeFraming(width, height, { wide: isWideViewport() });
  camera.position.z = framing.cameraZ;
  assets.pin.position.set(framing.anchorX, framing.anchorY, 0.04);
  sim.setAnchor([framing.anchorX, framing.anchorY, 0]);
  return [framing.anchorX, framing.anchorY];
}

export function createBadgeScene(container: HTMLElement, options: BadgeSceneOptions): BadgeSceneHandle {
  return buildGuarded((disposers) => {
    const renderer = createRenderer(container, disposers);
    const camera = createCamera();
    const scene = createStage();
    disposers.add(() => disposeTree(scene));
    const assets = buildBadgeAssets(Math.min(8, renderer.capabilities.getMaxAnisotropy()), options.fonts, options.images);
    scene.add(assets.card, assets.clip, assets.pin, assets.lanyard.mesh);
    const sim = createRopeSim(options.reducedMotion, options.onFlip);
    let anchor: [number, number] = [0, 0];
    const swing = { value: "" };
    let unsubscribe: (() => void) | null = null;
    let scrollVelocity = 0;
    const setFollowingScroll = (follow: boolean): void => {
      if (options.reducedMotion) return;
      if (follow && !unsubscribe) {
        unsubscribe = scrollMotion.subscribe(({ velocity }) => {
          scrollVelocity = velocity;
        });
      } else if (!follow && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        scrollVelocity = 0;
      }
    };
    disposers.add(() => setFollowingScroll(false));
    disposers.add(() => delete container.dataset.swing);

    disposers.add(
      attachPointerControls(renderer.domElement, camera, assets.card, {
        getTip: sim.tip,
        onGrab: sim.grab,
        onDrag: sim.drag,
        onRelease: sim.release,
      }),
    );
    startRuntime({
      container,
      renderer,
      scene,
      camera,
      disposers,
      onLost: options.onLost,
      onVisibilityChange: setFollowingScroll,
      onResize: (width, height) => {
        anchor = frame(camera, sim, assets, width, height);
      },
      update: (dt, seconds) => {
        if (scrollVelocity !== 0) sim.applyScrollImpulse(scrollVelocity, dt);
        sim.advance(dt, seconds);
        place(sim, assets, anchor[0], anchor[1]);
        reportSwing(container, sim.pose(OFFSETS).angleZ, swing);
      },
    });
    setFollowingScroll(true);
    return { dispose: disposers.run, redraw: assets.redraw };
  });
}
