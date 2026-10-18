"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/core/lib/motion";
import { parallaxOffset, quantise } from "@/core/lib/parallax";
import { rafThrottle } from "@/core/lib/raf-throttle";
import { scrollMotion } from "@/core/lib/scroll-motion";

interface Layer {
  readonly el: HTMLElement;
  readonly speed: number;
  centerY: number;
  offset: number;
  near: boolean;
  written: string;
}

function collect(selector: string): Layer[] {
  const layers: Layer[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    const speed = Number(el.dataset.parallax);
    if (!Number.isFinite(speed) || speed === 0) continue;
    layers.push({ el, speed, centerY: 0, offset: 0, near: false, written: "" });
  }
  return layers;
}

export function useParallax(selector = "[data-parallax]"): void {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

    const layers = collect(selector);
    if (!layers.length) return;

    // Geometry is cached; scroll frames only read this and write --py.
    let viewportH = window.innerHeight;
    let scrollY = window.scrollY;

    const apply = (layer: Layer): void => {
      const value = String(quantise(parallaxOffset(layer.centerY, scrollY, viewportH, layer.speed)));
      if (value === layer.written) return;
      layer.written = value;
      layer.offset = Number(value);
      layer.el.style.setProperty("--py", value);
    };
    const update = (): void => {
      for (const layer of layers) if (layer.near) apply(layer);
    };
    // A nested layer is also shifted by every parallax ancestor, so all of those offsets come off its rest position.
    const stackedOffset = (layer: (typeof layers)[number]): number =>
      layers.reduce((sum, other) => (other.el.contains(layer.el) ? sum + other.offset : sum), 0);
    const measure = (): void => {
      viewportH = window.innerHeight;
      scrollY = window.scrollY;
      for (const layer of layers) {
        const rect = layer.el.getBoundingClientRect();
        layer.centerY = rect.top + rect.height / 2 + scrollY - stackedOffset(layer);
      }
      update();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const layer = layers.find((l) => l.el === entry.target);
          if (!layer) continue;
          layer.near = entry.isIntersecting;
          if (layer.near) apply(layer);
        }
      },
      { rootMargin: "50% 0px" },
    );
    for (const layer of layers) io.observe(layer.el);

    const remeasure = rafThrottle<void>(measure);
    const onChange = (): void => remeasure.call(undefined);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onChange);
    ro?.observe(document.body);
    window.addEventListener("resize", onChange, { passive: true });
    window.addEventListener("load", onChange);
    let disposed = false;
    void document.fonts?.ready.then(() => {
      if (!disposed) onChange();
    });

    measure();
    const unsubscribe = scrollMotion.subscribe((sample) => {
      scrollY = sample.scrollY;
      update();
    });

    return () => {
      disposed = true;
      unsubscribe();
      remeasure.cancel();
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener("resize", onChange);
      window.removeEventListener("load", onChange);
      for (const layer of layers) layer.el.style.removeProperty("--py");
    };
  }, [selector]);
}
