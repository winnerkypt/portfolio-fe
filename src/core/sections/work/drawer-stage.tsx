"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { projects } from "@/core/data/projects";
import { useLazyScene, type SceneFactory } from "@/core/hooks/useLazyScene";
import { loadImage } from "@/core/lib/load-image";
import { optimizedSrc } from "@/core/lib/optimized-src";
import { fontFamilies } from "@/core/libs/fonts";
import type { DrawerSceneHandle } from "@/core/three/drawer-scene";
import { useCaseSelection } from "./case-selection";

interface DrawerStageProps {
  readonly label: string;
  readonly children: ReactNode;
}

const sheetSrc = (src: string): string => optimizedSrc(src, { width: 600, height: 375, quality: 75 });

interface Bindings {
  readonly stage: RefObject<HTMLDivElement | null>;
  readonly scene: RefObject<DrawerSceneHandle | null>;
  readonly index: RefObject<number>;
  readonly select: RefObject<(index: number) => void>;
}

async function loadDrawer(bindings: Bindings): Promise<SceneFactory> {
  const [images, { createDrawerScene }] = await Promise.all([
    Promise.all(projects.map((project) => loadImage(sheetSrc(project.image)))),
    import("@/core/three/drawer-scene"),
  ]);
  return (container, hooks) => {
    const scene = createDrawerScene(container, {
      projects,
      images,
      fonts: fontFamilies,
      initialIndex: bindings.index.current,
      onSelect: (next) => bindings.select.current(next),
      onIndexChange: (next) => bindings.stage.current?.setAttribute("data-scene-index", String(next)),
      onLost: hooks.onLost,
    });
    bindings.scene.current = scene;
    return {
      redraw: scene.redraw,
      dispose() {
        bindings.scene.current = null;
        bindings.stage.current?.removeAttribute("data-scene-index");
        scene.dispose();
      },
    };
  };
}

export function DrawerStage({ label, children }: DrawerStageProps) {
  const { index, select } = useCaseSelection();
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DrawerSceneHandle | null>(null);
  const indexRef = useRef(index);
  const selectRef = useRef(select);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setReady(false), []);

  useEffect(() => {
    indexRef.current = index;
    selectRef.current = select;
    sceneRef.current?.setIndex(index);
  }, [index, select]);

  const load = useCallback(
    () => loadDrawer({ stage: stageRef, scene: sceneRef, index: indexRef, select: selectRef }),
    [],
  );

  useLazyScene(mountRef, load, { fonts: fontFamilies, onReady, onLost });

  return (
    <div className="files-stage" ref={stageRef} data-scene="drawer" data-ready={ready} data-index={index} role="img" aria-label={label}>
      {children}
      <div className="drawer-canvas" ref={mountRef} />
    </div>
  );
}
