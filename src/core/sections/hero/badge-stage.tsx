"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { profileImage } from "@/core/data/profile-image";
import { useLazyScene, type SceneFactory } from "@/core/hooks/useLazyScene";
import { loadImage } from "@/core/lib/load-image";
import { optimizedSrc } from "@/core/lib/optimized-src";
import { fontFamilies } from "@/core/libs/fonts";

interface BadgeStageProps {
  readonly label: string;
  readonly children: ReactNode;
}

const PHOTO_SRC = optimizedSrc(profileImage.src, { width: 375, height: 335, quality: 80 });

export function BadgeStage({ label, children }: BadgeStageProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => {
    setReady(false);
    setFlipped(false);
  }, []);

  const load = useCallback(async (): Promise<SceneFactory> => {
    const [photo, { createBadgeScene }] = await Promise.all([loadImage(PHOTO_SRC), import("@/core/three/badge-scene")]);
    return (container, hooks) =>
      createBadgeScene(container, { fonts: fontFamilies, images: { photo }, reducedMotion: false, onFlip: setFlipped, onLost: hooks.onLost });
  }, []);

  useLazyScene(mountRef, load, { fonts: fontFamilies, onReady, onLost });

  return (
    <div data-scene="badge" data-ready={ready} data-flipped={flipped} role="img" aria-label={label}>
      {children}
      <div className="badge-canvas" ref={mountRef} />
    </div>
  );
}
