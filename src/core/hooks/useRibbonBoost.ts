"use client";

import { useEffect } from "react";
import { ribbonPlaybackRate, ribbonSkew } from "@/core/lib/ribbon-boost";
import { scrollMotion } from "@/core/lib/scroll-motion";

export function useRibbonBoost(): void {
  useEffect(() => {
    const ribbon = document.querySelector<HTMLElement>(".ribbon");
    const track = ribbon?.querySelector<HTMLElement>(".ribbon-track");
    if (!ribbon || !track) return;

    let rate = 1;
    let skew = "";
    const setRate = (next: number): void => {
      rate = next;
      for (const animation of track.getAnimations?.() ?? []) animation.playbackRate = next;
    };

    const unsubscribe = scrollMotion.subscribe(({ velocity }) => {
      const nextRate = Number(ribbonPlaybackRate(velocity).toFixed(2));
      if (nextRate !== rate) setRate(nextRate);
      const nextSkew = ribbonSkew(velocity).toFixed(2);
      if (nextSkew === skew) return;
      skew = nextSkew;
      ribbon.style.setProperty("--ribbon-skew", nextSkew);
    });

    return () => {
      unsubscribe();
      if (rate !== 1) setRate(1);
      ribbon.style.removeProperty("--ribbon-skew");
    };
  }, []);
}
