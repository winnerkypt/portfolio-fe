import { useEffect, useRef, type RefObject } from "react";
import { fontSpecs, type CanvasFonts } from "@/core/lib/canvas/fonts";
import { awaitFonts } from "@/core/lib/fonts-ready";
import { prefersReducedMotion } from "@/core/lib/motion";
import { hasWebGL } from "@/core/lib/webgl";

export interface SceneHandle {
  dispose(): void;
  redraw(): void;
}

export type SceneFactory = (container: HTMLElement, hooks: { onLost: () => void }) => SceneHandle;
export type SceneLoader = () => Promise<SceneFactory>;

interface LazySceneOptions {
  readonly fonts: CanvasFonts;
  readonly onReady?: () => void;
  readonly onLost?: () => void;
}

interface Callbacks {
  readonly load: RefObject<SceneLoader>;
  readonly onReady: RefObject<(() => void) | undefined>;
  readonly onLost: RefObject<(() => void) | undefined>;
}

interface Lifecycle {
  start(): Promise<void>;
  cancel(): void;
}

const NEAR_VIEWPORT = "200px";
const RECHECK_MS = 500;

function redrawWhenFontsArrive(fonts: CanvasFonts, handle: SceneHandle, isCurrent: () => boolean): (() => void) | null {
  const target = document.fonts;
  if (!target) return null;
  const stop = (): void => target.removeEventListener("loadingdone", onDone);
  function onDone(): void {
    void awaitFonts(fontSpecs(fonts), RECHECK_MS).then((loaded) => {
      if (!loaded || !isCurrent()) return;
      stop();
      handle.redraw();
    });
  }
  target.addEventListener("loadingdone", onDone);
  return stop;
}

function createLifecycle(container: HTMLElement, fonts: CanvasFonts, callbacks: Callbacks): Lifecycle {
  let cancelled = false;
  let started = false;
  let scene: SceneHandle | null = null;
  let removeFontsListener: (() => void) | null = null;

  const release = (): void => {
    removeFontsListener?.();
    removeFontsListener = null;
    scene?.dispose();
    scene = null;
  };

  const onLost = (): void => {
    try {
      release();
    } finally {
      callbacks.onLost.current?.();
    }
  };

  return {
    async start() {
      if (started) return;
      started = true;
      try {
        const [fontsLoaded, create] = await Promise.all([awaitFonts(fontSpecs(fonts)), callbacks.load.current()]);
        if (cancelled) return;
        const handle = create(container, { onLost });
        scene = handle;
        if (!fontsLoaded) removeFontsListener = redrawWhenFontsArrive(fonts, handle, () => scene === handle);
        callbacks.onReady.current?.();
      } catch (error) {
        console.warn("Scene unavailable, keeping the fallback image.", error);
      }
    },
    cancel() {
      cancelled = true;
      release();
    },
  };
}

function whenNearViewport(container: HTMLElement, run: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    run();
    return () => undefined;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      run();
    },
    { rootMargin: NEAR_VIEWPORT },
  );
  observer.observe(container);
  return () => observer.disconnect();
}

export function useLazyScene(containerRef: RefObject<HTMLElement | null>, load: SceneLoader, options: LazySceneOptions): void {
  const { fonts } = options;
  const loadRef = useRef(load);
  const onReadyRef = useRef(options.onReady);
  const onLostRef = useRef(options.onLost);

  useEffect(() => {
    loadRef.current = load;
    onReadyRef.current = options.onReady;
    onLostRef.current = options.onLost;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion() || !hasWebGL()) return;

    const lifecycle = createLifecycle(container, fonts, { load: loadRef, onReady: onReadyRef, onLost: onLostRef });
    const stopWatching = whenNearViewport(container, () => void lifecycle.start());

    return () => {
      stopWatching();
      lifecycle.cancel();
    };
  }, [containerRef, fonts]);
}
