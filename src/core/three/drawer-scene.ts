import { Group } from "three";
import type { Project } from "@/core/data/types/project";
import type { CanvasFonts } from "@/core/lib/canvas/fonts";
import { IDLE_FRAME_MS } from "@/core/lib/quality";
import { disposeTree } from "./dispose";
import { buildGuarded } from "./disposers";
import { createDrawerCamera, createDrawerStage } from "./drawer-env";
import { createDrawerMotion } from "./drawer-motion";
import { attachDrawerPicking } from "./drawer-picking";
import { createFolder, type Folder } from "./folder-mesh";
import { startRuntime } from "./scene-runtime";
import { createRenderer } from "./stage-setup";

export interface DrawerSceneOptions {
  readonly projects: readonly Project[];
  readonly images: readonly (HTMLImageElement | null)[];
  readonly fonts: CanvasFonts;
  readonly initialIndex: number;
  readonly onSelect: (index: number) => void;
  readonly onIndexChange?: (index: number) => void;
  readonly onLost?: () => void;
}

export interface DrawerSceneHandle {
  setIndex(index: number): void;
  redraw(): void;
  dispose(): void;
}

const MAX_ANISOTROPY = 8;

function buildFolders(options: DrawerSceneOptions, anisotropy: number): Folder[] {
  const { projects, images, fonts } = options;
  return projects.map((project, index) =>
    createFolder({ index, count: projects.length, project, image: images[index] ?? null, fonts, anisotropy }),
  );
}

export function createDrawerScene(container: HTMLElement, options: DrawerSceneOptions): DrawerSceneHandle {
  return buildGuarded((disposers) => {
    const renderer = createRenderer(container, disposers);
    const camera = createDrawerCamera();
    const scene = createDrawerStage();
    disposers.add(() => disposeTree(scene));
    const anisotropy = Math.min(MAX_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
    const folders = buildFolders(options, anisotropy);
    const row = new Group();
    row.add(...folders.map((folder) => folder.group));
    scene.add(row);

    const motion = createDrawerMotion(folders, row, camera, options.initialIndex);
    const setIndex = (index: number): void => {
      if (!Number.isInteger(index) || index < 0 || index >= folders.length) return;
      motion.setSelected(index);
      options.onIndexChange?.(index);
    };
    disposers.add(
      attachDrawerPicking(
        renderer.domElement,
        camera,
        folders.flatMap((folder, index) => folder.pickables.map((object) => ({ object, index }))),
        {
          onHover: motion.setHover,
          onPointer: motion.setPointerX,
          onSelect: (index) => {
            setIndex(index);
            options.onSelect(index);
          },
        },
      ),
    );
    startRuntime({
      container,
      renderer,
      scene,
      camera,
      disposers,
      onLost: options.onLost,
      onResize: (width, height) => motion.resize(width / height),
      update: motion.step,
      frameInterval: () => (motion.isIdle() ? IDLE_FRAME_MS : 0),
    });
    options.onIndexChange?.(options.initialIndex);
    return { setIndex, redraw: () => folders.forEach((folder) => folder.redraw()), dispose: disposers.run };
  });
}
